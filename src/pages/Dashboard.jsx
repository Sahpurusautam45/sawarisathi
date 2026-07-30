import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { getVehicles } from "../services/vehicleService";
function Dashboard() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("User");
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
  const fetchUser = async () => {
    try {
      const user = auth.currentUser;
     

      if (!user) return;

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setFullName(docSnap.data().fullName);
      }
      const vehicleList = await getVehicles();
      setVehicles(vehicleList);
    } catch (error) {
      console.error(error);
    }
  };

  fetchUser();
}, []);
  return (
    <div className="min-h-screen bg-slate-100 p-8">

      <div className="max-w-7xl mx-auto">

        <div>
  <p className="text-gray-500 text-lg">
    Welcome back 👋
  </p>

  <h1 className="text-4xl font-bold mt-1">
    {fullName}
  </h1>

  <p className="text-gray-500 mt-2">
    Manage your vehicles, insurance, tax and documents from one place.
  </p>
</div>

        <div className="mt-10">

  <h2 className="text-3xl font-bold mb-6">
    🚗 My Vehicles ({vehicles.length})
  </h2>
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

  {vehicles.length === 0 ? (

  <div className="col-span-full bg-white rounded-2xl shadow-lg p-10 text-center">

    <div className="text-6xl">🚗</div>

    <h3 className="text-2xl font-bold mt-4">
      No vehicles added yet
    </h3>

    <p className="text-gray-500 mt-3">
      Add your first vehicle to manage insurance,
      tax, bluebook and more.
    </p>

  </div>

) : (

  vehicles.map((vehicle) => (
    <div
      key={vehicle.id}
      className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition"
    >
      <h3 className="text-xl font-bold">
        {vehicle.brand} {vehicle.model}
      </h3>

      <p className="text-gray-500 mt-2">
        {vehicle.vehicleNumber}
      </p>

      <p className="text-green-600 mt-3">
        🚘{vehicle.vehicleType}
      <div className="mt-3">
  <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-semibold">
    🟡 Pending Verification
  </span>
</div>
      </p>
    <button
      onClick={() => navigate(`/vehicle/${vehicle.id}`)}
      className="mt-6 w-full bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-xl"
    >
      Manage Vehicle
    </button>
    </div>
  ))

  )
  }

  <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition">

    <h3 className="text-xl font-bold">
      + Add Vehicle
    </h3>

    <p className="text-gray-500 mt-2">
      Register another vehicle
    </p>

    <button
      onClick={() => navigate("/add-vehicle")}
      className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl"
    >
      Add Vehicle
    </button>

  </div>

</div>

</div>
        
      </div>

    </div>
  );
}

export default Dashboard;