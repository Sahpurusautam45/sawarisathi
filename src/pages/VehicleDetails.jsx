import LoadingSpinner from "../components/LoadingSpinner";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { removeVehicle } from "../services/vehicleService";

function VehicleDetails() {
  const { vehicleId } = useParams();
  const navigate = useNavigate();

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
        // NEW ARCHITECTURE
        // vehicles/{vehicleId}
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
      "Remove this vehicle from your dashboard?"
    );

    if (!confirmed) return;

    try {
      await removeVehicle(vehicleId);

      alert("Vehicle removed successfully!");

      navigate("/dashboard");
    } catch (error) {
      console.error(error);

      alert("Failed to remove vehicle.");
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
            Vehicle not found
          </h2>

          <p className="text-gray-500 mt-2">
            This vehicle may have been removed or is unavailable.
          </p>

          <button
            onClick={() => navigate("/dashboard")}
            className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl"
          >
            Back to Dashboard
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
              <strong>Vehicle Type</strong>
              <p>{vehicle.vehicleType}</p>
            </div>

            <div>
              <strong>Brand</strong>
              <p>{vehicle.brand}</p>
            </div>

            <div>
              <strong>Model</strong>
              <p>{vehicle.model}</p>
            </div>

            <div>
              <strong>Color</strong>
              <p>{vehicle.color}</p>
            </div>

            <div>
              <strong>Status</strong>

              <p className="text-yellow-600">
                {vehicle.status || "Pending"}
              </p>
            </div>

          </div>

          {/* ==========================================
              VEHICLE RECORDS
          ========================================== */}

          <div className="mt-10">

            <div className="mb-6">

              <h2 className="text-2xl font-bold">
                📂 Vehicle Records
              </h2>

              <p className="text-gray-500 mt-1">
                Manage all official documents for this vehicle.
              </p>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* ======================================
                  BLUEBOOK
              ====================================== */}

              <div
                onClick={() =>
                  navigate(`/vehicle/${vehicleId}/bluebook`)
                }
                className="bg-white border rounded-2xl p-6 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition duration-300"
              >

                <div className="flex justify-between items-center">

                  <h3 className="text-xl font-bold">
                    📘 Bluebook
                  </h3>

                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      bluebookExists
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {bluebookExists
                      ? "Added"
                      : "Not Added"}
                  </span>

                </div>

                <p className="text-gray-500 mt-4">
                  {bluebookExists
                    ? "Manage your Bluebook"
                    : "Add your Bluebook"}
                </p>

                <p className="text-blue-700 mt-6 font-semibold">
                  Click to Manage →
                </p>

              </div>

              {/* ======================================
                  INSURANCE
              ====================================== */}

              <div
                onClick={() =>
                  navigate(`/vehicle/${vehicleId}/insurance`)
                }
                className="bg-white border rounded-2xl p-6 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition duration-300"
              >

                <div className="flex justify-between items-center">

                  <h3 className="text-xl font-bold">
                    🛡 Insurance
                  </h3>

                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      insuranceExists
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {insuranceExists
                      ? "Added"
                      : "Not Added"}
                  </span>

                </div>

                <p className="text-gray-500 mt-4">
                  {insuranceExists
                    ? "Manage your Insurance"
                    : "Add your Insurance"}
                </p>

                <p className="text-blue-700 mt-6 font-semibold">
                  Click to Manage →
                </p>

              </div>

              {/* ======================================
                  TAX
              ====================================== */}

              <div
                onClick={() =>
                  navigate(`/vehicle/${vehicleId}/tax`)
                }
                className="bg-white border rounded-2xl p-6 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition duration-300"
              >

                <div className="flex justify-between items-center">

                  <h3 className="text-xl font-bold">
                    💰 Vehicle Tax
                  </h3>

                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      taxExists
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {taxExists
                      ? "Active"
                      : "Inactive"}
                  </span>

                </div>

                <p className="text-gray-500 mt-4">
                  {taxExists
                    ? "Manage your Vehicle Tax"
                    : "Add your Vehicle Tax"}
                </p>

                <p className="text-blue-700 mt-6 font-semibold">
                  {taxExists
                    ? "Manage →"
                    : "Add Now →"}
                </p>

              </div>

              {/* ======================================
                  DOCUMENTS
              ====================================== */}

              <div
                onClick={() =>
                  navigate(`/vehicle/${vehicleId}/documents`)
                }
                className="bg-white border rounded-2xl p-6 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition duration-300"
              >

                <div className="flex justify-between items-center">

                  <h3 className="text-xl font-bold">
                    📄 Documents
                  </h3>

                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      documentsExists
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {documentsExists
                      ? "Added"
                      : "Not Added"}
                  </span>

                </div>

                <p className="text-gray-500 mt-4">
                  {documentsExists
                    ? "Manage your Vehicle Documents"
                    : "Upload Vehicle Documents"}
                </p>

                <p className="text-blue-700 mt-6 font-semibold">
                  {documentsExists
                    ? "Manage →"
                    : "Add Now →"}
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
                ⚠ Report Incorrect Information
              </button>

              <button
                onClick={handleRemoveVehicle}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl"
              >
                🗑 Remove From My Dashboard
              </button>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default VehicleDetails;