import LoadingSpinner from "../components/LoadingSpinner";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

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

import dotmOffices from "../data/dotmOffices";

import {
  saveBluebook,
  getBluebook,
} from "../services/bluebookService";


function Bluebook() {

  const { vehicleId } = useParams();
  const navigate = useNavigate();


  // ==========================================
  // VEHICLE
  // ==========================================

  const [vehicle, setVehicle] = useState(null);

  const [bluebook, setBluebook] = useState(null);


  // ==========================================
  // BLUEBOOK FORM
  // ==========================================

  const [province, setProvince] = useState("");
  const [office, setOffice] = useState("");
  const [bluebookNumber, setBluebookNumber] = useState("");
  const [registrationDate, setRegistrationDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");


  // ==========================================
  // BLUEBOOK STATUS
  // ==========================================

  const [bluebookStatus, setBluebookStatus] =
    useState("Pending");

  const [bluebookRejectionReason, setBluebookRejectionReason] =
    useState("");


  // ==========================================
  // CORRECTION MODE
  // ==========================================

  const [isCorrecting, setIsCorrecting] =
    useState(false);


  // ==========================================
  // LOADING
  // ==========================================

  const [saving, setSaving] =
    useState(false);


  // ==========================================
  // LOAD VEHICLE + BLUEBOOK
  // ==========================================

  useEffect(() => {

    const fetchVehicle = async () => {

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
        // LOAD BLUEBOOK STATUS
        // ======================================

        setBluebookStatus(
          vehicleData.bluebookStatus ||
          "Pending"
        );


        setBluebookRejectionReason(
          vehicleData.bluebookRejectionReason ||
          ""
        );


        // ======================================
        // BLUEBOOK
        // ======================================

        const data =
          await getBluebook(vehicleId);


        if (data) {

          setBluebook(data);

          // Load existing values into form
          setProvince(
            data.provinceId || ""
          );

          setOffice(
            data.officeId || ""
          );

          setBluebookNumber(
            data.bluebookNumber || ""
          );

          setRegistrationDate(
            data.registrationDate || ""
          );

          setExpiryDate(
            data.expiryDate || ""
          );

        } else {

          setBluebook(null);

        }

      } catch (error) {

        console.error(
          "Bluebook load error:",
          error
        );

        alert(
          "Failed to load Bluebook information."
        );

      }
    };


    fetchVehicle();

  }, [
    vehicleId,
    navigate,
  ]);


  // ==========================================
  // SELECTED PROVINCE
  // ==========================================

  const selectedProvince =
    dotmOffices.find(
      (item) =>
        item.province_id === province
    );


  // ==========================================
  // OFFICES
  // ==========================================

  const offices =
    selectedProvince
      ? selectedProvince.offices
      : [];


  // ==========================================
  // START CORRECTION
  // ==========================================

  const handleStartCorrection = () => {

    if (!bluebook) {
      return;
    }


    setProvince(
      bluebook.provinceId || ""
    );

    setOffice(
      bluebook.officeId || ""
    );

    setBluebookNumber(
      bluebook.bluebookNumber || ""
    );

    setRegistrationDate(
      bluebook.registrationDate || ""
    );

    setExpiryDate(
      bluebook.expiryDate || ""
    );


    setIsCorrecting(true);

  };


  // ==========================================
  // CANCEL CORRECTION
  // ==========================================

  const handleCancelCorrection = () => {

    if (bluebook) {

      setProvince(
        bluebook.provinceId || ""
      );

      setOffice(
        bluebook.officeId || ""
      );

      setBluebookNumber(
        bluebook.bluebookNumber || ""
      );

      setRegistrationDate(
        bluebook.registrationDate || ""
      );

      setExpiryDate(
        bluebook.expiryDate || ""
      );

    }

    setIsCorrecting(false);

  };


  // ==========================================
  // SUBMIT BLUEBOOK
  // ==========================================

  const handleSubmit = async () => {

    // ========================================
    // VALIDATION
    // ========================================

    if (
      !province ||
      !office ||
      !bluebookNumber.trim() ||
      !registrationDate ||
      !expiryDate
    ) {
      alert("Please fill all fields.");
      return;
    }

    try {

      setSaving(true);

      // ======================================
      // SAVE BLUEBOOK DATA
      // ======================================

      await saveBluebook(
        vehicleId,
        {
          provinceId: province,
          officeId: office,
          bluebookNumber: bluebookNumber.trim(),
          registrationDate,
          expiryDate,
        }
      );


      // ======================================
      // RESUBMISSION MODE
      // ======================================

      if (isCorrecting) {

        const vehicleRef = doc(
          db,
          "vehicles",
          vehicleId
        );


        await updateDoc(
          vehicleRef,
          {
            bluebookStatus: "Pending",

            bluebookRejectionReason: "",

            bluebookResubmitted: true,

            bluebookResubmittedAt:
              serverTimestamp(),

            remarks:
              "Bluebook resubmitted for Admin re-verification.",

            updatedAt:
              serverTimestamp(),
          }
        );


        // ==================================
        // RESUBMISSION NOTIFICATION
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
            "Bluebook",

        });


        // ==================================
        // UPDATE LOCAL STATE
        // ==================================

        setBluebook({

          provinceId: province,

          officeId: office,

          bluebookNumber:
            bluebookNumber.trim(),

          registrationDate,

          expiryDate,

        });


        setBluebookStatus("Pending");

        setBluebookRejectionReason("");

        setIsCorrecting(false);


        alert(
          "🔄 Bluebook resubmitted successfully. It is now pending Admin verification."
        );

        return;
      }


      // ======================================
      // NEW / FIRST-TIME SUBMISSION
      // ======================================

      const vehicleRef = doc(
        db,
        "vehicles",
        vehicleId
      );


      // ======================================
      // SET VEHICLE STATUS TO PENDING
      // ======================================

      await updateDoc(
        vehicleRef,
        {
          bluebookStatus: "Pending",

          bluebookResubmitted: false,

          bluebookRejectionReason: "",

          updatedAt:
            serverTimestamp(),
        }
      );


      // ======================================
      // 🔔 NEW BLUEBOOK ADMIN NOTIFICATION
      // ======================================

      await createAdminNotification({

        vehicleId,

        vehicleNumber:
          vehicle?.vehicleNumber || "",

        ownerId:
          vehicle?.ownerId || "",

        ownerName:
          vehicle?.ownerName || "",

        documentType:
          "Bluebook",

        type:
          "document_submission",

        category:
          "documents",

        title:
          "New Bluebook Submitted",

        message:
          `Bluebook for ${vehicle?.vehicleNumber || "vehicle"} has been submitted for verification.`,

      });


      // ======================================
      // UPDATE LOCAL STATE
      // ======================================

      setBluebook({

        provinceId: province,

        officeId: office,

        bluebookNumber:
          bluebookNumber.trim(),

        registrationDate,

        expiryDate,

      });


      setBluebookStatus(
        "Pending"
      );


      setBluebookRejectionReason(
        ""
      );


      alert(
        "📘 Bluebook submitted successfully! It is now pending Admin verification."
      );


    } catch (error) {

      console.error(
        "Bluebook save error:",
        error
      );

      alert(
        isCorrecting
          ? "Failed to resubmit Bluebook. Please try again."
          : "Failed to save Bluebook. Please try again."
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

          📘 Vehicle Bluebook

        </h1>


        <div className="bg-slate-100 rounded-xl p-5 mt-6 text-center">

          <h2 className="text-xl font-bold">

            🚗 {vehicle.brand} {vehicle.model}

          </h2>


          <p className="text-gray-600 mt-2">

            {vehicle.vehicleNumber}

          </p>

        </div>


        {/* ====================================
            REJECTED BLUEBOOK
        ==================================== */}

        {bluebookStatus === "Rejected" &&
          bluebook &&
          !isCorrecting && (

            <div className="bg-red-50 border border-red-200 rounded-xl p-6 mt-8">

              <div className="flex items-center justify-between">

                <h2 className="text-2xl font-bold text-red-700">

                  ❌ Bluebook Rejected

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

                  {bluebookRejectionReason ||
                    "No rejection reason was provided by the Admin."}

                </p>

              </div>


              <button
                type="button"
                onClick={handleStartCorrection}
                className="w-full mt-5 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold transition"
              >

                ✏️ Correct & Resubmit Bluebook

              </button>

            </div>

          )}


        {/* ====================================
            PENDING MESSAGE
        ==================================== */}

        {bluebookStatus === "Pending" &&
          bluebook &&
          !isCorrecting && (

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 mt-8">

              <p className="text-yellow-700 font-semibold">

                ⏳ Bluebook is currently pending Admin verification.

              </p>

              <p className="text-yellow-600 text-sm mt-1">

                Please wait while our Admin reviews your Bluebook information.

              </p>

            </div>

          )}


        {/* ====================================
            VERIFIED BLUEBOOK
        ==================================== */}

        {bluebookStatus === "Verified" &&
          bluebook &&
          !isCorrecting && (

            <div className="bg-green-50 border border-green-200 rounded-xl p-6 mt-8">

              <div className="flex items-center justify-between mb-4">

                <h2 className="text-2xl font-bold">

                  📘 Bluebook Details

                </h2>


                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">

                  ✓ Verified

                </span>

              </div>


              <p>
                <strong>Province:</strong>{" "}

                {
                  dotmOffices.find(
                    (p) =>
                      p.province_id ===
                      bluebook.provinceId
                  )?.province_name ||
                  "—"
                }

              </p>


              <p className="mt-3">

                <strong>
                  Transport Office:
                </strong>{" "}

                {
                  dotmOffices
                    .find(
                      (p) =>
                        p.province_id ===
                        bluebook.provinceId
                    )
                    ?.offices.find(
                      (o) =>
                        o.office_id ===
                        bluebook.officeId
                    )?.office_name ||
                  "—"
                }

              </p>


              <p className="mt-3">

                <strong>
                  Bluebook Number:
                </strong>{" "}

                {bluebook.bluebookNumber}

              </p>


              <p className="mt-3">

                <strong>
                  Registration Date:
                </strong>{" "}

                {bluebook.registrationDate}

              </p>


              <p className="mt-3">

                <strong>
                  Bluebook Expiry:
                </strong>{" "}

                {bluebook.expiryDate}

              </p>

            </div>

          )}


        {/* ====================================
            EXISTING BLUEBOOK — UNKNOWN STATUS
        ==================================== */}

        {bluebook &&
          !isCorrecting &&
          bluebookStatus !== "Rejected" &&
          bluebookStatus !== "Verified" &&
          bluebookStatus !== "Pending" && (

            <div className="bg-gray-50 border rounded-xl p-6 mt-8">

              <h2 className="text-2xl font-bold mb-4">

                📘 Bluebook Details

              </h2>


              <p>
                <strong>Province:</strong>{" "}

                {
                  dotmOffices.find(
                    (p) =>
                      p.province_id ===
                      bluebook.provinceId
                  )?.province_name ||
                  "—"
                }

              </p>


              <p className="mt-3">

                <strong>
                  Transport Office:
                </strong>{" "}

                {
                  dotmOffices
                    .find(
                      (p) =>
                        p.province_id ===
                        bluebook.provinceId
                    )
                    ?.offices.find(
                      (o) =>
                        o.office_id ===
                        bluebook.officeId
                    )?.office_name ||
                  "—"
                }

              </p>


              <p className="mt-3">

                <strong>
                  Bluebook Number:
                </strong>{" "}

                {bluebook.bluebookNumber}

              </p>


              <p className="mt-3">

                <strong>
                  Registration Date:
                </strong>{" "}

                {bluebook.registrationDate}

              </p>


              <p className="mt-3">

                <strong>
                  Bluebook Expiry:
                </strong>{" "}

                {bluebook.expiryDate}

              </p>

            </div>

          )}


        {/* ====================================
            BLUEBOOK FORM
        ==================================== */}

        {(!bluebook || isCorrecting) && (

          <div className="mt-8 space-y-5">


            {/* ==================================
                CORRECTION HEADER
            ================================== */}

            {isCorrecting && (

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">

                <h2 className="text-xl font-bold text-blue-700">

                  ✏️ Correct Bluebook Information

                </h2>


                <p className="text-blue-600 mt-2">

                  Correct the rejected information and submit it again for Admin verification.

                </p>

              </div>

            )}


            {/* ==================================
                PROVINCE
            ================================== */}

            <div>

              <label className="font-semibold">

                Province

              </label>


              <select
                value={province}
                onChange={(e) => {

                  setProvince(
                    e.target.value
                  );

                  setOffice("");

                }}
                className="w-full border rounded-lg p-3 mt-2"
              >

                <option value="">

                  Select Province

                </option>


                {dotmOffices.map(
                  (item) => (

                    <option
                      key={
                        item.province_id
                      }
                      value={
                        item.province_id
                      }
                    >

                      {item.province_name}

                    </option>

                  )
                )}

              </select>

            </div>


            {/* ==================================
                TRANSPORT OFFICE
            ================================== */}

            <div>

              <label className="font-semibold">

                Transport Office

              </label>


              <select
                value={office}
                onChange={(e) =>
                  setOffice(
                    e.target.value
                  )
                }
                disabled={!province}
                className="w-full border rounded-lg p-3 mt-2"
              >

                <option value="">

                  Select Transport Office

                </option>


                {offices.map(
                  (item) => (

                    <option
                      key={
                        item.office_id
                      }
                      value={
                        item.office_id
                      }
                    >

                      {item.office_name}

                    </option>

                  )
                )}

              </select>

            </div>


            {/* ==================================
                BLUEBOOK NUMBER
            ================================== */}

            <div>

              <label className="font-semibold">

                Bluebook Number

              </label>


              <input
                type="text"
                value={bluebookNumber}
                onChange={(e) =>
                  setBluebookNumber(
                    e.target.value
                  )
                }
                placeholder="Enter Bluebook Number"
                className="w-full border rounded-lg p-3 mt-2"
              />

            </div>


            {/* ==================================
                REGISTRATION DATE
            ================================== */}

            <div>

              <label className="font-semibold">

                Registration Date

              </label>


              <input
                type="date"
                value={registrationDate}
                onChange={(e) =>
                  setRegistrationDate(
                    e.target.value
                  )
                }
                className="w-full border rounded-lg p-3 mt-2"
              />

            </div>


            {/* ==================================
                EXPIRY DATE
            ================================== */}

            <div>

              <label className="font-semibold">

                Bluebook Expiry

              </label>


              <input
                type="date"
                value={expiryDate}
                onChange={(e) =>
                  setExpiryDate(
                    e.target.value
                  )
                }
                className="w-full border rounded-lg p-3 mt-2"
              />

            </div>


            {/* ==================================
                BUTTONS
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
                  : "Submit Bluebook"}

            </button>


            {/* ==================================
                CANCEL CORRECTION
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


export default Bluebook;