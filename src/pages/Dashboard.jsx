import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
function Dashboard() {
  const navigate = useNavigate();
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