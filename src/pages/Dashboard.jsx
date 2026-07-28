import { useEffect, useState } from "react";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
function Dashboard() {
  const [fullName, setFullName] = useState("User");
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
    } catch (error) {
      console.error(error);
    }
  };

  fetchUser();
}, []);
  return (
    <div className="min-h-screen bg-slate-100 p-8">

      <div className="max-w-7xl mx-auto">

        <h1 className="text-4xl font-bold">
          👋 Welcome, {fullName}
        </h1>

        <div className="mt-10">

  <h2 className="text-3xl font-bold mb-6">
    🚗 My Vehicles
  </h2>

  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

    <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition">

      <h3 className="text-xl font-bold">
        Honda Shine
      </h3>

      <p className="text-gray-500 mt-2">
        BA 2 PA 1234
      </p>

      <p className="mt-4 text-green-600 font-semibold">
        🟢Excellent 
      </p>

      <button className="mt-6 w-full bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-xl">
        Manage Vehicle
      </button>

    </div>

    <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition">

      <h3 className="text-xl font-bold">
        Hyundai Creta
      </h3>

      <p className="text-gray-500 mt-2">
        BA 20 CHA 5678
      </p>

      <p className="mt-4 text-yellow-600 font-semibold">
        🟡 Attention Needed
      </p>

      <button className="mt-6 w-full bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-xl">
        Manage Vehicle
      </button>

    </div>

    <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition">

      <h3 className="text-xl font-bold">
        + Add Vehicle
      </h3>

      <p className="text-gray-500 mt-2">
        Register another vehicle
      </p>

      <button className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl">
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