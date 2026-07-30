import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";

function VehicleDetails() {
  const { vehicleId } = useParams();

  const [vehicle, setVehicle] = useState(null);

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

          <div className="mt-8 flex gap-4">

            <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-xl">
              ✏ Edit Vehicle
            </button>

            <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl">
              🗑 Delete Vehicle
            </button>

          </div>

        </div>

      </div>
    </div>
  );
}

export default VehicleDetails;