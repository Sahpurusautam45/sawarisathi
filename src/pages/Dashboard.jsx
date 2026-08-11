import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { getVehicles } from "../services/vehicleService";
import { useLanguage } from "../context/LanguageContext";

function Dashboard() {
  const navigate = useNavigate();

  const { language, t } = useLanguage();

  const [fullName, setFullName] = useState("User");
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const user = auth.currentUser;

        if (!user) {
          setLoading(false);
          return;
        }

        // Get user profile
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();

          setFullName(userData.fullName || "User");
        }

        // Get user's vehicles
        const vehicleList = await getVehicles();

        setVehicles(vehicleList);
      } catch (error) {
        console.error("Dashboard Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">

          <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>

          <p className="text-gray-500 mt-4">
            {t("loadingVehicles")}
          </p>

        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* ==============================
          Welcome Section
      ============================== */}

      <div className="mb-8">

        <h1 className="text-3xl font-bold text-gray-800">
          {t("welcome")}, {fullName} 👋
        </h1>

        <p className="text-gray-500 mt-2">
          {t("manageYourVehicles")}
        </p>

      </div>


      {/* ==============================
          Vehicles Section
      ============================== */}

      <div className="mt-10">

        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {t("myVehicles")}
        </h2>


        {vehicles.length === 0 ? (

          /* ============================
             No Vehicles
          ============================ */

          <div className="bg-white rounded-2xl shadow-sm border p-8 text-center">

            <div className="text-6xl">
              🚗
            </div>

            <h3 className="text-2xl font-bold mt-4">
              {t("noVehiclesYet")}
            </h3>

            <p className="text-gray-500 mt-3">
              {t("addFirstVehicleMessage")}
            </p>

            <button
              onClick={() => navigate("/add-vehicle")}
              className="mt-6 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl"
            >
              {t("addYourFirstVehicle")}
            </button>

          </div>

        ) : (

          /* ============================
             Vehicle List
          ============================ */

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {vehicles.map((vehicle) => (

              <div
                key={vehicle.id}
                className="bg-white rounded-2xl shadow-sm border p-6"
              >

                <h3 className="text-xl font-bold text-gray-800">
                  {vehicle.brand} {vehicle.model}
                </h3>

                <p className="text-gray-500 mt-2">
                  {vehicle.vehicleNumber}
                </p>

                <p className="text-green-600 mt-3">
                  🚘 {vehicle.vehicleType}
                </p>

                <p className="text-gray-500 mt-2">
                  {t("color")}: {vehicle.color}
                </p>


                {/* Status */}

                <div className="mt-4">

                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      vehicle.status === "Verified"
                        ? "bg-green-100 text-green-700"
                        : vehicle.status === "Rejected"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {vehicle.status === "Verified"
                      ? t("verified")
                      : vehicle.status === "Rejected"
                      ? t("rejected")
                      : t("pending")}
                  </span>

                </div>


                {/* Manage Vehicle */}

                <button
                  onClick={() =>
                    navigate(`/vehicle/${vehicle.id}`)
                  }
                  className="mt-5 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl"
                >
                  {t("manageVehicle")}
                </button>

              </div>

            ))}

          </div>

        )}

      </div>


      {/* ==============================
          Add Another Vehicle
      ============================== */}

      {vehicles.length > 0 && (

        <div className="mt-8 bg-gray-50 rounded-2xl border p-6 text-center">

          <h3 className="text-xl font-bold">
            + {t("addAnotherVehicle")}
          </h3>

          <p className="text-gray-500 mt-2">
            {t("registerAnotherVehicle")}
          </p>

          <button
            onClick={() => navigate("/add-vehicle")}
            className="mt-6 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl"
          >
            {t("addVehicle")}
          </button>

        </div>

      )}

    </div>
  );
}

export default Dashboard;