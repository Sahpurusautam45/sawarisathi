import LoadingSpinner from "../components/LoadingSpinner";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { removeVehicle } from "../services/vehicleService";
import { useLanguage } from "../context/LanguageContext";

function VehicleDetails() {
  const { vehicleId } = useParams();
  const navigate = useNavigate();

  const { t } = useLanguage();

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);

  const [bluebookExists, setBluebookExists] = useState(false);
  const [insuranceExists, setInsuranceExists] = useState(false);
  const [taxExists, setTaxExists] = useState(false);
  const [documentsExists, setDocumentsExists] = useState(false);

  useEffect(() => {
    const fetchVehicleData = async () => {
      try {
        const user = auth.currentUser;

        if (!user) {
          navigate("/login");
          return;
        }

        // ==========================================
        // MAIN VEHICLE
        // ==========================================

        const vehicleRef = doc(
          db,
          "vehicles",
          vehicleId
        );

        const vehicleSnap = await getDoc(vehicleRef);

        if (!vehicleSnap.exists()) {
          console.error("Vehicle not found.");

          setVehicle(null);
          return;
        }

        setVehicle({
          id: vehicleSnap.id,
          ...vehicleSnap.data(),
        });

        // ==========================================
        // HELPER
        // Check NEW location first.
        // If not found, check OLD location.
        // ==========================================

        const getRecord = async (collectionName) => {
          // NEW LOCATION

          const newRef = doc(
            db,
            "vehicles",
            vehicleId,
            collectionName,
            "details"
          );

          const newSnap = await getDoc(newRef);

          if (newSnap.exists()) {
            return newSnap.data();
          }

          // OLD LOCATION

          const oldRef = doc(
            db,
            "users",
            user.uid,
            "vehicles",
            vehicleId,
            collectionName,
            "details"
          );

          const oldSnap = await getDoc(oldRef);

          if (oldSnap.exists()) {
            return oldSnap.data();
          }

          return null;
        };

        // ==========================================
        // LOAD ALL VEHICLE RECORDS
        // ==========================================

        const [
          bluebookData,
          insuranceData,
          taxData,
          documentsData,
        ] = await Promise.all([
          getRecord("bluebook"),
          getRecord("insurance"),
          getRecord("tax"),
          getRecord("documents"),
        ]);

        // ==========================================
        // UPDATE STATUS BADGES
        // ==========================================

        setBluebookExists(!!bluebookData);
        setInsuranceExists(!!insuranceData);
        setTaxExists(!!taxData);
        setDocumentsExists(!!documentsData);

      } catch (error) {
        console.error("Vehicle Details Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleData();
  }, [vehicleId, navigate]);

  // ==========================================
  // REMOVE VEHICLE
  // ==========================================

  const handleRemoveVehicle = async () => {
    const confirmed = window.confirm(
      t("removeVehicleConfirm")
    );

    if (!confirmed) return;

    try {
      await removeVehicle(vehicleId);

      alert(t("vehicleRemoved"));

      navigate("/dashboard");

    } catch (error) {
      console.error(error);

      alert(t("removeVehicleFailed"));
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return <LoadingSpinner />;
  }

  // ==========================================
  // VEHICLE NOT FOUND
  // ==========================================

  if (!vehicle) {
    return (
      <div className="min-h-screen flex items-center justify-center">

        <div className="text-center">

          <div className="text-6xl">
            🚗
          </div>

          <h2 className="text-2xl font-bold mt-4">
            {t("vehicleNotFound")}
          </h2>

          <p className="text-gray-500 mt-2">
            {t("vehicleUnavailable")}
          </p>

          <button
            onClick={() => navigate("/dashboard")}
            className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl"
          >
            {t("backToDashboard")}
          </button>

        </div>

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-8">

      <div className="max-w-5xl mx-auto">

        <div className="bg-white rounded-2xl shadow-lg p-8">

          {/* ==========================================
              VEHICLE HEADER
          ========================================== */}

          <h1 className="text-4xl font-bold">
            🚗 {vehicle.brand} {vehicle.model}
          </h1>

          <p className="text-gray-500 mt-2">
            {vehicle.vehicleNumber}
          </p>


          {/* ==========================================
              VEHICLE INFORMATION
          ========================================== */}

          <div className="mt-6 grid grid-cols-2 gap-4">

            <div>
              <strong>{t("vehicleType")}</strong>
              <p>{vehicle.vehicleType}</p>
            </div>

            <div>
              <strong>{t("brand")}</strong>
              <p>{vehicle.brand}</p>
            </div>

            <div>
              <strong>{t("model")}</strong>
              <p>{vehicle.model}</p>
            </div>

            <div>
              <strong>{t("color")}</strong>
              <p>{vehicle.color}</p>
            </div>

            <div>
              <strong>{t("status")}</strong>

              <p className="text-yellow-600">
                {vehicle.status || t("pending")}
              </p>
            </div>

          </div>


          {/* ==========================================
              VEHICLE RECORDS
          ========================================== */}

          <div className="mt-10">

            <div className="mb-6">

              <h2 className="text-2xl font-bold">
                📂 {t("vehicleRecords")}
              </h2>

              <p className="text-gray-500 mt-1">
                {t("manageOfficialDocuments")}
              </p>

            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* ======================================
                  BLUEBOOK
              ====================================== */}

              <div
                onClick={() =>
                  navigate(
                    `/vehicle/${vehicleId}/bluebook`
                  )
                }
                className="bg-white border rounded-2xl p-6 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition duration-300"
              >

                <div className="flex justify-between items-center">

                  <h3 className="text-xl font-bold">
                    📘 {t("bluebook")}
                  </h3>

                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      bluebookExists
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {bluebookExists
                      ? t("added")
                      : t("notAdded")}
                  </span>

                </div>

                <p className="text-gray-500 mt-4">
                  {bluebookExists
                    ? t("manageBluebook")
                    : t("addBluebook")}
                </p>

                <p className="text-blue-700 mt-6 font-semibold">
                  {t("clickToManage")}
                </p>

              </div>


              {/* ======================================
                  INSURANCE
              ====================================== */}

              <div
                onClick={() =>
                  navigate(
                    `/vehicle/${vehicleId}/insurance`
                  )
                }
                className="bg-white border rounded-2xl p-6 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition duration-300"
              >

                <div className="flex justify-between items-center">

                  <h3 className="text-xl font-bold">
                    🛡 {t("insurance")}
                  </h3>

                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      insuranceExists
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {insuranceExists
                      ? t("added")
                      : t("notAdded")}
                  </span>

                </div>

                <p className="text-gray-500 mt-4">
                  {insuranceExists
                    ? t("manageInsurance")
                    : t("addInsurance")}
                </p>

                <p className="text-blue-700 mt-6 font-semibold">
                  {t("clickToManage")}
                </p>

              </div>


              {/* ======================================
                  TAX
              ====================================== */}

              <div
                onClick={() =>
                  navigate(
                    `/vehicle/${vehicleId}/tax`
                  )
                }
                className="bg-white border rounded-2xl p-6 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition duration-300"
              >

                <div className="flex justify-between items-center">

                  <h3 className="text-xl font-bold">
                    💰 {t("vehicleTax")}
                  </h3>

                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      taxExists
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {taxExists
                      ? t("active")
                      : t("inactive")}
                  </span>

                </div>

                <p className="text-gray-500 mt-4">
                  {taxExists
                    ? t("manageVehicleTax")
                    : t("addVehicleTax")}
                </p>

                <p className="text-blue-700 mt-6 font-semibold">
                  {taxExists
                    ? t("manage")
                    : t("addNow")}
                </p>

              </div>


              {/* ======================================
                  DOCUMENTS
              ====================================== */}

              <div
                onClick={() =>
                  navigate(
                    `/vehicle/${vehicleId}/documents`
                  )
                }
                className="bg-white border rounded-2xl p-6 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition duration-300"
              >

                <div className="flex justify-between items-center">

                  <h3 className="text-xl font-bold">
                    📄 {t("documents")}
                  </h3>

                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      documentsExists
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {documentsExists
                      ? t("added")
                      : t("notAdded")}
                  </span>

                </div>

                <p className="text-gray-500 mt-4">
                  {documentsExists
                    ? t("manageVehicleDocuments")
                    : t("uploadVehicleDocuments")}
                </p>

                <p className="text-blue-700 mt-6 font-semibold">
                  {documentsExists
                    ? t("manage")
                    : t("addNow")}
                </p>

              </div>

            </div>


            {/* ==========================================
                ACTIONS
            ========================================== */}

            <div className="mt-8 flex flex-col md:flex-row gap-4">

              <button
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl"
              >
                ⚠ {t("reportIncorrectInformation")}
              </button>

              <button
                onClick={handleRemoveVehicle}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl"
              >
                🗑 {t("removeFromDashboard")}
              </button>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default VehicleDetails;