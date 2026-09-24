import LoadingSpinner from "../components/LoadingSpinner";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { auth, db } from "../firebase/firebase";

import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import {
  createAdminNotification,
} from "../services/adminNotificationService";

import { saveTax, getTax } from "../services/taxService";

function Tax() {
  const { vehicleId } = useParams();
  const navigate = useNavigate();

  // ==========================================
  // VEHICLE
  // ==========================================

  const [vehicle, setVehicle] = useState(null);

  // ==========================================
  // TAX
  // ==========================================

  const [tax, setTax] = useState(null);

  // ==========================================
  // TAX FORM
  // ==========================================

  const [receiptNumber, setReceiptNumber] = useState("");
  const [paidUntil, setPaidUntil] = useState("");

  // ==========================================
  // ADMIN TAX STATUS
  // ==========================================

  const [taxAdminStatus, setTaxAdminStatus] =
    useState("Pending");

  const [taxRejectionReason, setTaxRejectionReason] =
    useState("");

  // ==========================================
  // CORRECTION MODE
  // ==========================================

  const [isCorrecting, setIsCorrecting] =
    useState(false);


  const [isRenewing, setIsRenewing] =
    useState(false);

  // ==========================================
  // SAVING
  // ==========================================

  const [saving, setSaving] = useState(false);

  // ==========================================
  // LOAD VEHICLE + TAX
  // ==========================================

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = auth.currentUser;

        if (!user) {
          navigate("/login");
          return;
        }

        // ======================================
        // VEHICLE
        // ======================================

        const vehicleRef = doc(
          db,
          "vehicles",
          vehicleId
        );

        const vehicleSnap =
          await getDoc(vehicleRef);

        if (!vehicleSnap.exists()) {
          alert("Vehicle not found.");
          navigate("/dashboard");
          return;
        }

        const vehicleData =
          vehicleSnap.data();

        // ======================================
        // VERIFY OWNER
        // ======================================

        if (
          vehicleData.ownerId &&
          vehicleData.ownerId !== user.uid
        ) {
          alert(
            "You are not authorized to access this vehicle."
          );

          navigate("/dashboard");
          return;
        }

        setVehicle(vehicleData);

        // ======================================
        // ADMIN TAX STATUS
        // ======================================

        setTaxAdminStatus(
          vehicleData.taxStatus || "Pending"
        );

        setTaxRejectionReason(
          vehicleData.taxRejectionReason || ""
        );

        // ======================================
        // TAX
        // ======================================

        const taxData =
          await getTax(vehicleId);

        if (taxData) {
          setTax(taxData);

          setReceiptNumber(
            taxData.receiptNumber || ""
          );

          setPaidUntil(
            taxData.paidUntil || ""
          );
        } else {
          setTax(null);
        }
      } catch (error) {
        console.error(
          "Tax loading error:",
          error
        );

        alert(
          "Failed to load tax information."
        );
      }
    };

    fetchData();
  }, [vehicleId, navigate]);

  // ==========================================
  // TAX EXPIRY STATUS
  // ==========================================

  const taxStatus =
    tax &&
      tax.paidUntil &&
      new Date(tax.paidUntil) >= new Date()
      ? "Active"
      : "Expired";



  // ==========================================
  // START CORRECTION
  // ==========================================

  const handleStartCorrection = () => {
    if (!tax) return;

    setReceiptNumber(
      tax.receiptNumber || ""
    );

    setPaidUntil(
      tax.paidUntil || ""
    );

    setIsCorrecting(true);
  };



  const handleStartRenewal = () => {
    setIsRenewing(true);
    setIsCorrecting(false);

    // Scroll to the tax form
    setTimeout(() => {
      document
        .getElementById("tax-form")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 100);
  };

  // ==========================================
  // CANCEL CORRECTION
  // ==========================================

  const handleCancelCorrection = () => {
    if (tax) {
      setReceiptNumber(
        tax.receiptNumber || ""
      );

      setPaidUntil(
        tax.paidUntil || ""
      );
    }

    setIsCorrecting(false);
  };

  // ==========================================
  // SUBMIT TAX
  // ==========================================

  const handleSubmit = async () => {
    if (
      !receiptNumber.trim() ||
      !paidUntil
    ) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      setSaving(true);

      // ======================================
      // SAVE TAX INFORMATION
      // ======================================

      await saveTax(vehicleId, {
        receiptNumber:
          receiptNumber.trim(),

        paidUntil,

        status: "Active",
      });

      // ======================================
      // TAX RENEWAL SUBMISSION
      // ======================================

      if (isRenewing) {
        const vehicleRef = doc(
          db,
          "vehicles",
          vehicleId
        );

        await updateDoc(vehicleRef, {
          taxStatus: "Pending",

          taxRenewalPending: true,

          taxRenewalSubmittedAt:
            serverTimestamp(),

          taxRejectionReason: "",

          updatedAt:
            serverTimestamp(),
        });

        // ==================================
        // NOTIFY ADMIN
        // ==================================

        await createAdminNotification({
          vehicleId,
          vehicleNumber:
            vehicle?.vehicleNumber || "",
          ownerId:
            vehicle?.ownerId || "",
          ownerName:
            vehicle?.ownerName || "",
          documentType: "Tax",

          type: "document_renewal",
          category: "documents",

          title: "Tax Renewal Submitted",

          message:
            `Tax renewal for ${vehicle?.vehicleNumber || "vehicle"} has been submitted for verification.`,
        });

        setTax({
          receiptNumber:
            receiptNumber.trim(),
          paidUntil,
          status: "Active",
        });

        setTaxAdminStatus("Pending");

        setIsRenewing(false);

        alert(
          "🔄 Tax renewal submitted successfully. It is now pending Admin verification."
        );

        return;
      }

      // ======================================
      // RESUBMISSION
      // ======================================

      if (isCorrecting) {
        const vehicleRef = doc(
          db,
          "vehicles",
          vehicleId
        );

        await updateDoc(vehicleRef, {

          // ----------------------------------
          // RESET TAX STATUS
          // ----------------------------------

          taxStatus: "Pending",

          // ----------------------------------
          // CLEAR REJECTION
          // ----------------------------------

          taxRejectionReason: "",

          // ----------------------------------
          // RESUBMISSION INFORMATION
          // ----------------------------------

          taxResubmitted: true,

          taxResubmittedAt:
            serverTimestamp(),

          // ----------------------------------
          // LAST UPDATE
          // ----------------------------------

          updatedAt:
            serverTimestamp(),
        });

        // ==================================
        // NOTIFY ADMIN
        // ==================================

        await createAdminNotification({
          vehicleId,
          vehicleNumber:
            vehicle.vehicleNumber || "",
          ownerId:
            vehicle.ownerId || "",
          ownerName:
            vehicle.ownerName || "",
          documentType:
            "Tax",
        });

        // ==================================
        // UPDATE LOCAL TAX
        // ==================================

        setTax({
          receiptNumber:
            receiptNumber.trim(),

          paidUntil,

          status: "Active",
        });

        setTaxAdminStatus("Pending");

        setTaxRejectionReason("");

        setIsCorrecting(false);

        alert(
          "🔄 Tax resubmitted successfully. It is now pending Admin verification."
        );

        return;
      }

      // ======================================
      // NORMAL SUBMISSION
      // ======================================

      setTax({
        receiptNumber:
          receiptNumber.trim(),

        paidUntil,

        status: "Active",
      });

      // ==================================
      // 🔔 NEW TAX NOTIFICATION
      // ==================================

      await createAdminNotification({

        vehicleId,

        vehicleNumber:
          vehicle?.vehicleNumber || "",

        ownerId:
          vehicle?.ownerId || "",

        ownerName:
          vehicle?.ownerName || "",

        documentType:
          "Tax",

        type:
          "document_submission",

        category:
          "documents",

        title:
          "New Tax Submitted",

        message:
          `Tax for ${vehicle?.vehicleNumber || "vehicle"} has been submitted for verification.`,

      });

      alert(
        "Vehicle tax submitted successfully!"
      );
    } catch (error) {
      console.error(
        "Tax save error:",
        error
      );

      alert(
        isCorrecting
          ? "Failed to resubmit tax. Please try again."
          : "Failed to save tax."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (!vehicle) {
    return <LoadingSpinner />;
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="min-h-screen bg-slate-100 p-8">

      {/* ======================================
          BACK BUTTON
      ====================================== */}

      <button
        type="button"
        onClick={() =>
          navigate(`/vehicle/${vehicleId}`)
        }
        className="mb-6 bg-white border px-4 py-2 rounded-xl hover:bg-slate-100 transition"
      >
        ← Back to Vehicle Details
      </button>

      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8">

        {/* ====================================
            HEADER
        ==================================== */}

        <h1 className="text-3xl font-bold text-center">
          💰 Vehicle Tax
        </h1>

        {/* ====================================
            VEHICLE CARD
        ==================================== */}

        <div className="bg-slate-100 rounded-xl p-5 mt-6 text-center">

          <h2 className="text-xl font-bold">
            🚗 {vehicle.brand} {vehicle.model}
          </h2>

          <p className="text-gray-600 mt-2">
            {vehicle.vehicleNumber}
          </p>

        </div>

        {/* ====================================
            REJECTED TAX
        ==================================== */}

        {taxAdminStatus === "Rejected" &&
          tax &&
          !isCorrecting && (

            <div className="bg-red-50 border border-red-200 rounded-xl p-6 mt-8">

              <div className="flex items-center justify-between">

                <h2 className="text-2xl font-bold text-red-700">
                  ❌ Tax Rejected
                </h2>

                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">
                  Rejected
                </span>

              </div>

              <div className="mt-4 bg-white border border-red-100 rounded-xl p-4">

                <p className="font-semibold text-gray-700">
                  Rejection Reason
                </p>

                <p className="text-red-600 mt-2">
                  {taxRejectionReason ||
                    "No rejection reason was provided by the Admin."}
                </p>

              </div>

              {/* CURRENT TAX DATA */}

              <div className="bg-white rounded-xl p-4 mt-4">

                <p>
                  <strong>
                    Receipt Number:
                  </strong>{" "}
                  {tax.receiptNumber}
                </p>

                <p className="mt-3">
                  <strong>
                    Paid Until:
                  </strong>{" "}
                  {tax.paidUntil}
                </p>

              </div>

              <button
                type="button"
                onClick={handleStartCorrection}
                className="w-full mt-5 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold transition"
              >
                ✏️ Correct & Resubmit Tax
              </button>

            </div>
          )}

        {/* ====================================
            PENDING
        ==================================== */}

        {taxAdminStatus === "Pending" &&
          tax &&
          !isCorrecting && (

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 mt-8">

              <p className="text-yellow-700 font-semibold">
                ⏳ Tax is currently pending Admin verification.
              </p>

              <p className="text-yellow-600 text-sm mt-1">
                Please wait while our Admin reviews your tax information.
              </p>

            </div>
          )}

        {/* ====================================
            VERIFIED
        ==================================== */}

        {taxAdminStatus === "Verified" &&
          tax &&
          !isCorrecting && (

            <div className="bg-green-50 border border-green-200 rounded-xl p-6 mt-8">

              <div className="flex items-center justify-between mb-4">

                <h2 className="text-2xl font-bold">
                  💰 Vehicle Tax Details
                </h2>

                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                  ✓ Verified
                </span>

              </div>

              <p>
                <strong>
                  Receipt Number:
                </strong>{" "}
                {tax.receiptNumber}
              </p>

              <p className="mt-3">
                <strong>
                  Paid Until:
                </strong>{" "}
                {tax.paidUntil}
              </p>

              <p className="mt-4">
                <strong>
                  Tax Validity:
                </strong>

                <span
                  className={`ml-2 px-3 py-1 rounded-full ${taxStatus === "Active"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                    }`}
                >
                  {taxStatus === "Active"
                    ? "🟢 Active"
                    : "🔴 Expired"}
                </span>
              </p>

              {taxStatus === "Expired" &&
                taxAdminStatus === "Verified" && (
                  <button
                    type="button"
                    onClick={handleStartRenewal}
                    className="px-4 py-2 rounded-lg font-medium transition"
                  >
                    🔄 Renew / Update Tax
                  </button>
                )}

            </div>
          )}

        {/* ====================================
            UNKNOWN / OLD STATUS
        ==================================== */}

        {tax &&
          !isCorrecting &&
          taxAdminStatus !== "Rejected" &&
          taxAdminStatus !== "Pending" &&
          taxAdminStatus !== "Verified" && (

            <div className="bg-gray-50 border rounded-xl p-6 mt-8">

              <h2 className="text-2xl font-bold mb-4">
                💰 Vehicle Tax Details
              </h2>

              <p>
                <strong>
                  Receipt Number:
                </strong>{" "}
                {tax.receiptNumber}
              </p>

              <p className="mt-3">
                <strong>
                  Paid Until:
                </strong>{" "}
                {tax.paidUntil}
              </p>

              <p className="mt-4">
                <strong>
                  Status:
                </strong>

                <span
                  className={`ml-2 px-3 py-1 rounded-full ${taxStatus === "Active"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                    }`}
                >
                  {taxStatus === "Active"
                    ? "🟢 Active"
                    : "🔴 Expired"}
                </span>
              </p>

            </div>
          )}

        {/* ====================================
            TAX FORM
        ==================================== */}

        {(!tax || isCorrecting || isRenewing) && (

          <div className="mt-8 space-y-5">

            {/* ==================================
                CORRECTION HEADER
            ================================== */}

            {isCorrecting && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                <h2 className="text-xl font-bold text-blue-700">
                  ✏️ Correct Tax Information
                </h2>

                <p className="text-blue-600 mt-2">
                  Correct the rejected information and submit it again for Admin verification.
                </p>
              </div>
            )}

            {isRenewing && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                <h2 className="text-xl font-bold text-green-700">
                  🔄 Renew Vehicle Tax
                </h2>

                <p className="text-green-600 mt-2">
                  Enter your new tax information and submit it for Admin verification.
                </p>
              </div>
            )}

            {/* ==================================
                RECEIPT NUMBER
            ================================== */}

            <div>

              <label className="font-semibold">
                Tax Receipt Number
              </label>

              <input
                type="text"
                value={receiptNumber}
                onChange={(e) =>
                  setReceiptNumber(
                    e.target.value
                  )
                }
                placeholder="Enter receipt number"
                className="w-full border rounded-lg p-3 mt-2"
              />

            </div>

            {/* ==================================
                PAID UNTIL
            ================================== */}

            <div>

              <label className="font-semibold">
                Tax Paid Until
              </label>

              <input
                type="date"
                value={paidUntil}
                onChange={(e) =>
                  setPaidUntil(
                    e.target.value
                  )
                }
                className="w-full border rounded-lg p-3 mt-2"
              />

            </div>

            {/* ==================================
                SUBMIT
            ================================== */}

            <button
              onClick={handleSubmit}
              disabled={saving}
              className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-gray-400 text-white py-3 rounded-xl font-semibold transition"
            >

              {saving
                ? "Saving..."
                : isCorrecting
                  ? "🔄 Submit for Re-verification"
                  : "Submit Vehicle Tax"}

            </button>

            {/* ==================================
                CANCEL
            ================================== */}

            {isCorrecting && (

              <button
                type="button"
                onClick={handleCancelCorrection}
                disabled={saving}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-xl font-semibold transition"
              >
                Cancel
              </button>

            )}

          </div>
        )}

      </div>
    </div>
  );
}

export default Tax;