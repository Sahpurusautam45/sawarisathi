import {
  saveInsurance,
  getInsurance,
} from "../services/insuranceService";

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

import insuranceCompanies from "../data/insuranceCompanies";

import { auth, db } from "../firebase/firebase";

import {
  createAdminNotification,
} from "../services/adminNotificationService";

import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";


function Insurance() {

  const { vehicleId } = useParams();
  const navigate = useNavigate();


  // ==========================================
  // VEHICLE
  // ==========================================

  const [vehicle, setVehicle] = useState(null);


  // ==========================================
  // INSURANCE
  // ==========================================

  const [insurance, setInsurance] = useState(null);


  // ==========================================
  // INSURANCE FORM
  // ==========================================

  const [category, setCategory] = useState("");
  const [company, setCompany] = useState("");
  const [otherCompany, setOtherCompany] = useState("");
  const [policyNumber, setPolicyNumber] = useState("");
  const [validUntil, setValidUntil] = useState("");


  // ==========================================
  // ADMIN STATUS
  // ==========================================

  const [insuranceStatus, setInsuranceStatus] =
    useState("Pending");

  const [insuranceRejectionReason, setInsuranceRejectionReason] =
    useState("");


  // ==========================================
  // CORRECTION MODE
  // ==========================================

  const [isCorrecting, setIsCorrecting] =
    useState(false);

  const [isRenewing, setIsRenewing] = useState(false);


  // ==========================================
  // SAVING
  // ==========================================

  const [saving, setSaving] =
    useState(false);

  // ==========================================
  // INSURANCE EXPIRY CHECK
  // ==========================================

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isInsuranceExpired =
    insurance?.validUntil &&
    new Date(insurance.validUntil) < today;

  console.log(
    "🔍 INSURANCE EXPIRY:",
    "validUntil =", insurance?.validUntil,
    "| today =", today.toISOString(),
    "| parsed =", insurance?.validUntil
    ? new Date(insurance.validUntil).toISOString()
    : null,
    "| expired =", isInsuranceExpired
  );


  // ==========================================
  // LOAD VEHICLE + INSURANCE
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
        // OWNER CHECK
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
        // ADMIN INSURANCE STATUS
        // ======================================

        setInsuranceStatus(
          vehicleData.insuranceStatus ||
          "Pending"
        );


        setInsuranceRejectionReason(
          vehicleData.insuranceRejectionReason ||
          ""
        );


        // ======================================
        // INSURANCE DATA
        // ======================================

        const data =
          await getInsurance(vehicleId);


        if (data) {

          setInsurance(data);


          // Load existing values

          setCategory(
            data.category || ""
          );

          setPolicyNumber(
            data.policyNumber || ""
          );

          setValidUntil(
            data.validUntil || ""
          );


          // Handle "Other" company

          const categoryCompanies =
            data.category === "general"
              ? insuranceCompanies.general
              : data.category === "micro"
                ? insuranceCompanies.micro
                : [];


          if (
            data.company &&
            categoryCompanies.includes(data.company)
          ) {

            setCompany(data.company);

            setOtherCompany("");

          } else if (data.company) {

            setCompany("Other");

            setOtherCompany(
              data.company
            );

          }

        } else {

          setInsurance(null);

        }

      } catch (error) {

        console.error(
          "Insurance loading error:",
          error
        );

        alert(
          "Failed to load insurance information."
        );

      }

    };


    fetchData();

  }, [
    vehicleId,
    navigate,
  ]);


  // ==========================================
  // COMPANIES
  // ==========================================

  const companies =
    category === "general"
      ? insuranceCompanies.general
      : category === "micro"
        ? insuranceCompanies.micro
        : [];





  // ==========================================
  // START CORRECTION
  // ==========================================

  const handleStartCorrection = () => {

    if (!insurance) {
      return;
    }


    setCategory(
      insurance.category || ""
    );

    setPolicyNumber(
      insurance.policyNumber || ""
    );

    setValidUntil(
      insurance.validUntil || ""
    );


    const categoryCompanies =
      insurance.category === "general"
        ? insuranceCompanies.general
        : insurance.category === "micro"
          ? insuranceCompanies.micro
          : [];


    if (
      insurance.company &&
      categoryCompanies.includes(
        insurance.company
      )
    ) {

      setCompany(
        insurance.company
      );

      setOtherCompany("");

    } else {

      setCompany("Other");

      setOtherCompany(
        insurance.company || ""
      );

    }


    setIsCorrecting(true);

  };

  // ==========================================
  // START INSURANCE RENEWAL
  // ==========================================

  // ==========================================
  // START INSURANCE RENEWAL
  // ==========================================

  const handleStartRenewal = () => {

    if (!insurance) {
      return;
    }

    // Keep existing insurance information
    setCategory(
      insurance.category || ""
    );

    setCompany(
      insurance.company || ""
    );

    setOtherCompany("");

    // KEEP EXISTING POLICY NUMBER
    setPolicyNumber(
      insurance.policyNumber || ""
    );

    // User will enter ONLY the new expiry date
    setValidUntil("");

    setIsRenewing(true);
    setIsCorrecting(false);
  };

  // ==========================================
  // CANCEL CORRECTION
  // ==========================================

  const handleCancelCorrection = () => {

    if (insurance) {

      setCategory(
        insurance.category || ""
      );

      setPolicyNumber(
        insurance.policyNumber || ""
      );

      setValidUntil(
        insurance.validUntil || ""
      );


      const categoryCompanies =
        insurance.category === "general"
          ? insuranceCompanies.general
          : insurance.category === "micro"
            ? insuranceCompanies.micro
            : [];


      if (
        insurance.company &&
        categoryCompanies.includes(
          insurance.company
        )
      ) {

        setCompany(
          insurance.company
        );

        setOtherCompany("");

      } else {

        setCompany("Other");

        setOtherCompany(
          insurance.company || ""
        );

      }

    }


    setIsCorrecting(false);

  };


  // ==========================================
  // SUBMIT INSURANCE
  // ==========================================

  const handleSubmit = async () => {

    // ========================================
    // RENEWAL VALIDATION
    // ========================================

    if (isRenewing) {

      if (!insurance) {
        alert("Existing insurance information not found.");
        return;
      }

      if (!validUntil) {
        alert("Please select the new insurance expiry date.");
        return;
      }

    }

    // ========================================
    // NORMAL / CORRECTION VALIDATION
    // ========================================

    if (!isRenewing) {

      if (
        !category ||
        !company ||
        !policyNumber.trim() ||
        !validUntil
      ) {
        alert(
          "Please fill all required fields."
        );

        return;
      }

      if (
        company === "Other" &&
        !otherCompany.trim()
      ) {
        alert(
          "Please enter the insurance company name."
        );

        return;
      }
    }


    try {

      setSaving(true);


      // ======================================
      // RENEWAL
      // ======================================

      if (isRenewing) {

        const finalCompany =
          insurance.company || company;

        const finalCategory =
          insurance.category || category;

        const finalPolicyNumber =
          insurance.policyNumber ||
          policyNumber.trim();


        // ====================================
        // SAVE RENEWED INSURANCE
        // ====================================

        await saveInsurance(
          vehicleId,
          {
            category: finalCategory,

            company: finalCompany,

            policyNumber:
              finalPolicyNumber,

            validUntil,
          }
        );


        // ====================================
        // UPDATE VEHICLE STATUS
        // ====================================

        const vehicleRef =
          doc(
            db,
            "vehicles",
            vehicleId
          );

        await updateDoc(
          vehicleRef,
          {

            insuranceStatus:
              "Pending",

            insuranceRenewalPending:
              true,

            insuranceRenewedAt:
              serverTimestamp(),

            insuranceRejectionReason:
              "",

            updatedAt:
              serverTimestamp(),
          }
        );


        // ====================================
        // UPDATE LOCAL INSURANCE
        // ====================================

        setInsurance({
          category:
            finalCategory,

          company:
            finalCompany,

          policyNumber:
            finalPolicyNumber,

          validUntil,

          status:
            "Pending Verification",
        });


        setInsuranceStatus(
          "Pending"
        );

        setInsuranceRejectionReason(
          ""
        );


        // ====================================
        // ADMIN NOTIFICATION
        // ====================================

        await createAdminNotification({

          vehicleId,

          vehicleNumber:
            vehicle?.vehicleNumber || "",

          ownerId:
            vehicle?.ownerId || "",

          ownerName:
            vehicle?.ownerName || "",

          documentType:
            "Insurance",

          type:
            "document_submission",

          category:
            "documents",

          title:
            "Insurance Renewal Submitted",

          message:
            `Insurance renewal for ${vehicle?.vehicleNumber ||
            "vehicle"
            } has been submitted for verification.`,

        });


        // ====================================
        // CLOSE RENEWAL FORM
        // ====================================

        setIsRenewing(false);


        alert(
          "🔄 Insurance renewal submitted successfully. It is now pending Admin verification."
        );


        return;
      }


      // ======================================
      // NORMAL / CORRECTION COMPANY
      // ======================================

      const finalCompany =
        company === "Other"
          ? otherCompany.trim()
          : company;


      // ======================================
      // SAVE INSURANCE
      // ======================================

      await saveInsurance(
        vehicleId,
        {
          category,

          company:
            finalCompany,

          policyNumber:
            policyNumber.trim(),

          validUntil,
        }
      );


      // ======================================
      // RESUBMISSION
      // ======================================

      if (isCorrecting) {

        const vehicleRef =
          doc(
            db,
            "vehicles",
            vehicleId
          );


        await updateDoc(
          vehicleRef,
          {

            insuranceStatus:
              "Pending",

            insuranceRejectionReason:
              "",

            insuranceResubmitted:
              true,

            insuranceResubmittedAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),

          }
        );


        // ==================================
        // UPDATE LOCAL STATE
        // ==================================

        setInsurance({

          category,

          company:
            finalCompany,

          policyNumber:
            policyNumber.trim(),

          validUntil,

          status:
            "Pending Verification",

        });


        setInsuranceStatus(
          "Pending"
        );


        setInsuranceRejectionReason(
          ""
        );


        // ==================================
        // ADMIN NOTIFICATION
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
            "Insurance",

        });


        // ==================================
        // CLOSE CORRECTION FORM
        // ==================================

        setIsCorrecting(false);


        alert(
          "🔄 Insurance resubmitted successfully. It is now pending Admin verification."
        );


        return;
      }


      // ======================================
      // NORMAL / NEW SUBMISSION
      // ======================================

      setInsurance({

        category,

        company:
          finalCompany,

        policyNumber:
          policyNumber.trim(),

        validUntil,

        status:
          "Pending Verification",

      });


      // ==================================
      // NEW INSURANCE NOTIFICATION
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
          "Insurance",

        type:
          "document_submission",

        category:
          "documents",

        title:
          "New Insurance Submitted",

        message:
          `Insurance for ${vehicle?.vehicleNumber ||
          "vehicle"
          } has been submitted for verification.`,

      });


      alert(
        "Insurance submitted successfully!"
      );


    } catch (error) {

      console.error(
        "Insurance save error:",
        error
      );


      alert(
        isRenewing
          ? "Failed to renew insurance. Please try again."
          : isCorrecting
            ? "Failed to resubmit insurance. Please try again."
            : "Failed to save insurance."
      );


    } finally {

      setSaving(false);

    }

  };

// ==========================================
// LOADING
// ==========================================

if (!vehicle) {

  return (
    <div className="min-h-screen flex items-center justify-center">

      <p>
        Loading...
      </p>

    </div>
  );

}


// ==========================================
// PAGE
// ==========================================

return (

  <div className="min-h-screen bg-slate-100 p-8">

    {/* ======================================
          BACK
      ====================================== */}

    <button
      type="button"
      onClick={() =>
        navigate(
          `/vehicle/${vehicleId}`
        )
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

        🛡 Insurance

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
            REJECTED INSURANCE
        ==================================== */}

      {insuranceStatus === "Rejected" &&
        insurance &&
        !isCorrecting && (

          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mt-8">


            <div className="flex items-center justify-between">

              <h2 className="text-2xl font-bold text-red-700">

                ❌ Insurance Rejected

              </h2>


              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">

                Rejected

              </span>

            </div>


            {/* REASON */}

            <div className="mt-4 bg-white border border-red-100 rounded-xl p-4">

              <p className="font-semibold text-gray-700">

                Rejection Reason

              </p>


              <p className="text-red-600 mt-2">

                {insuranceRejectionReason ||
                  "No rejection reason was provided by the Admin."}

              </p>

            </div>


            {/* CURRENT DATA */}

            <div className="bg-white rounded-xl p-4 mt-4 space-y-2">

              <p>
                <strong>
                  Category:
                </strong>{" "}
                {insurance.category}
              </p>


              <p>
                <strong>
                  Company:
                </strong>{" "}
                {insurance.company}
              </p>


              <p>
                <strong>
                  Policy Number:
                </strong>{" "}
                {insurance.policyNumber}
              </p>


              <p className="mt-3">
                <strong>
                  Valid Until:
                </strong>{" "}
                {insurance.validUntil}
              </p>


            </div>


            <button
              type="button"
              onClick={
                handleStartCorrection
              }
              className="w-full mt-5 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold transition"
            >

              ✏️ Correct & Resubmit Insurance

            </button>


          </div>

        )}


      {/* ====================================
            PENDING
        ==================================== */}

      {insuranceStatus === "Pending" &&
        insurance &&
        !isCorrecting && (

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 mt-8">

            <p className="text-yellow-700 font-semibold">

              ⏳ Insurance is currently pending Admin verification.

            </p>


            <p className="text-yellow-600 text-sm mt-1">

              Please wait while our Admin reviews your insurance information.

            </p>

          </div>

        )}


      {/* ====================================
    VERIFIED
==================================== */}

      {insuranceStatus === "Verified" &&
        insurance &&
        !isCorrecting &&
        !isRenewing && (

          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mt-8">

            <div className="flex items-center justify-between mb-4">

              <h2 className="text-2xl font-bold">
                🛡 Insurance Details
              </h2>

              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                ✓ Verified
              </span>

            </div>


            <p>
              <strong>
                Category:
              </strong>{" "}
              {insurance.category}
            </p>


            <p className="mt-3">
              <strong>
                Company:
              </strong>{" "}
              {insurance.company}
            </p>


            <p className="mt-3">
              <strong>
                Policy Number:
              </strong>{" "}
              {insurance.policyNumber}
            </p>


            <p className="mt-3">
              <strong>
                Valid Until:
              </strong>{" "}
              {insurance.validUntil}
            </p>


            {/* ==================================
        RENEWAL BUTTON
    ================================== */}

            {isInsuranceExpired && (

              <button
                type="button"
                onClick={handleStartRenewal}
                className="w-full mt-5 bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl font-semibold transition"
              >
                🔄 Renew / Update Insurance
              </button>

            )}

          </div>

        )}


      {/* ====================================
            OLD / UNKNOWN STATUS
        ==================================== */}

      {insurance &&
        !isCorrecting &&
        insuranceStatus !== "Rejected" &&
        insuranceStatus !== "Pending" &&
        insuranceStatus !== "Verified" && (

          <div className="bg-gray-50 border rounded-xl p-6 mt-8">

            <h2 className="text-2xl font-bold mb-4">

              🛡 Insurance Details

            </h2>


            <p>
              <strong>
                Category:
              </strong>{" "}
              {insurance.category}
            </p>


            <p className="mt-3">
              <strong>
                Company:
              </strong>{" "}
              {insurance.company}
            </p>


            <p className="mt-3">
              <strong>
                Policy Number:
              </strong>{" "}
              {insurance.policyNumber}
            </p>


            <p className="mt-3">
              <strong>
                Valid Until:
              </strong>{" "}
              {insurance.validUntil}
            </p>


          </div>

        )}


      {/* ====================================
            FORM
        ==================================== */}

      {(!insurance || isCorrecting || isRenewing) && (

        <div className="mt-8 space-y-5">


          {/* ==================================
                CORRECTION HEADER
            ================================== */}

          {isCorrecting && (

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">

              <h2 className="text-xl font-bold text-blue-700">

                ✏️ Correct Insurance Information

              </h2>


              <p className="text-blue-600 mt-2">

                Correct the rejected information and submit it again for Admin verification.

              </p>

            </div>

          )}

          {isRenewing && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
              <h2 className="text-xl font-bold text-green-700">
                🔄 Renew Vehicle Insurance
              </h2>

              <p className="text-green-600 mt-2">
                Enter your new insurance information and submit it for Admin verification.
              </p>
            </div>
          )}


          {/* ==================================
                CATEGORY
            ================================== */}

          <div>

            <label className="font-semibold">

              Insurance Category

            </label>


            <select
              value={category}
              onChange={(e) => {

                setCategory(
                  e.target.value
                );

                setCompany("");

                setOtherCompany("");

              }}
              className="w-full border rounded-lg p-3 mt-2"
            >

              <option value="">

                Select Insurance Category

              </option>


              <option value="general">

                General Non-Life Insurance

              </option>


              <option value="micro">

                Micro Non-Life Insurance

              </option>

            </select>

          </div>


          {/* ==================================
                COMPANY
            ================================== */}

          <div>

            <label className="font-semibold">

              Insurance Company

            </label>


            <select
              value={company}
              onChange={(e) =>
                setCompany(
                  e.target.value
                )
              }
              className="w-full border rounded-lg p-3 mt-2"
              disabled={!category}
            >

              <option value="">

                Select Insurance Company

              </option>


              {companies.map(
                (item) => (

                  <option
                    key={item}
                    value={item}
                  >

                    {item}

                  </option>

                )
              )}

            </select>

          </div>


          {/* ==================================
                OTHER COMPANY
            ================================== */}

          {company === "Other" && (

            <div>

              <label className="font-semibold">

                Insurance Company Name

              </label>


              <input
                type="text"
                value={otherCompany}
                onChange={(e) =>
                  setOtherCompany(
                    e.target.value
                  )
                }
                placeholder="Enter company name"
                className="w-full border rounded-lg p-3 mt-2"
              />

            </div>

          )}


          {/* ==================================
                POLICY NUMBER
            ================================== */}

          {!isRenewing && (
            <div>
              <label className="font-semibold">
                Policy Number
              </label>

              <input
                type="text"
                value={policyNumber}
                onChange={(e) =>
                  setPolicyNumber(
                    e.target.value
                  )
                }
                placeholder="Enter policy number"
                className="w-full border rounded-lg p-3 mt-2"
              />
            </div>
          )}


          {/* ==================================
                VALID UNTIL
            ================================== */}

          <div>

            <label className="font-semibold">

              Insurance Valid Until

            </label>


            <input
              type="date"
              value={validUntil}
              onChange={(e) =>
                setValidUntil(
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
                : isRenewing
                  ? "🔄 Submit Insurance Renewal"
                  : "Submit Insurance"}

          </button>


          {/* ==================================
                CANCEL
            ================================== */}

          {isCorrecting && (

            <button
              type="button"
              onClick={
                handleCancelCorrection
              }
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


export default Insurance;