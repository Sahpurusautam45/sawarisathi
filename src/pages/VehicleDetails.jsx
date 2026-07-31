import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { removeVehicle } from "../services/vehicleService";

function VehicleDetails() {
  const { vehicleId } = useParams();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState(null);

  // Remove Vehicle
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

  // Fetch Vehicle
  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const user = auth.currentUser;

        if (!user) return;

        const docRef = doc(db, "users", user.uid, "vehicles", vehicleId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setVehicle(docSnap.data());
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchVehicle();
  }, [vehicleId]);

  if (!vehicle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-4xl font-bold">
            🚗 {vehicle.brand} {vehicle.model}
          </h1>

          <p className="text-gray-500 mt-2">
            {vehicle.vehicleNumber}
          </p>

          <div className="mt-6 space-y-3">
            <p>
              <strong>Vehicle Type:</strong> {vehicle.vehicleType}
            </p>

            <p>
              <strong>Brand:</strong> {vehicle.brand}
            </p>

            <p>
              <strong>Model:</strong> {vehicle.model}
            </p>

            <p>
              <strong>Color:</strong> {vehicle.color}
            </p>
          </div>

          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">
              ⚙️ Vehicle Services
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-100 rounded-xl p-5">
                <h3 className="font-bold text-lg">📘 Bluebook</h3>
                <p className="text-gray-500 mt-2">Coming Soon</p>
              </div>

              <div className="bg-slate-100 rounded-xl p-5">
                <h3 className="font-bold text-lg">🛡 Insurance</h3>
                <p className="text-gray-500 mt-2">Coming Soon</p>
              </div>

              <div className="bg-slate-100 rounded-xl p-5">
                <h3 className="font-bold text-lg">💰 Tax</h3>
                <p className="text-gray-500 mt-2">Coming Soon</p>
              </div>

              <div className="bg-slate-100 rounded-xl p-5">
                <h3 className="font-bold text-lg">📄 Documents</h3>
                <p className="text-gray-500 mt-2">Coming Soon</p>
              </div>
            </div>

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