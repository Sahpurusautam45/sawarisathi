import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";

import { getBluebook } from "../services/bluebookService";
import { getInsurance } from "../services/insuranceService";
import { getTax } from "../services/taxService";
import { getVehicles } from "../services/vehicleService";
import { useLanguage } from "../context/LanguageContext";
import { getVehicleAlerts } from "../utils/vehicleAlerts";
import {
  createExpiryNotificationOnce,
  resolveExpiryNotification,
} from "../services/userNotificationService";

function Dashboard() {
  const navigate = useNavigate();

  const { t } = useLanguage();

  const [fullName, setFullName] = useState("User");
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  const createVehicleExpiryNotifications = async (
    vehicleList
  ) => {
    try {
      console.log(
        "🔔 Starting expiry notification check..."
      );

      for (const vehicle of vehicleList) {

        console.log(
          "🚗 Checking vehicle:",
          vehicle
        );

        const alerts = getVehicleAlerts(vehicle);

        console.log(
          "📋 Alerts for vehicle:",
          vehicle.id,
          alerts
        );

        for (const alert of alerts) {

          console.log(
            "🔍 Checking alert:",
            alert
          );

          if (
            alert.status !== "warning" &&
            alert.status !== "today" &&
            alert.status !== "expired"
          ) {
            console.log(
              "🟢 Alert is valid. Resolving old notification..."
            );

            try {
              await resolveExpiryNotification({
                vehicleId: vehicle.id,
                documentType: alert.documentType,
              });

              console.log(
                "✅ Old expiry notification resolved:",
                vehicle.id,
                alert.documentType
              );
            } catch (resolveError) {
              console.error(
                "❌ Failed to resolve expiry notification:",
                resolveError
              );
            }

            continue;
          }

          console.log(
            "⚠️ Creating notification for:",
            {
              vehicleId: vehicle.id,
              vehicleName:
                `${vehicle.brand || ""} ${vehicle.model || ""}`.trim()
                || "Vehicle",
              vehicleNumber:
                vehicle.vehicleNumber || "Unknown",
              documentType:
                alert.documentType,
              status:
                alert.status,
              message:
                alert.message,
            }
          );

          try {

            const result =
              await createExpiryNotificationOnce({
                vehicleId: vehicle.id,

                vehicleName:
                  `${vehicle.brand || ""} ${vehicle.model || ""}`.trim()
                  || "Vehicle",

                vehicleNumber:
                  vehicle.vehicleNumber || "Unknown",

                documentType:
                  alert.documentType,

                status:
                  alert.status,

                message:
                  alert.message,
              });

            console.log(
              "✅ Notification result:",
              result
            );

          } catch (notificationError) {

            console.error(
              "❌ Notification failed for this alert:",
              {
                vehicleId: vehicle.id,
                vehicleName:
                  vehicle.brand || vehicle.model,
                documentType:
                  alert.documentType,
                status:
                  alert.status,
              },
              notificationError
            );
          }
        }
      }

      console.log(
        "🔔 Expiry notification check finished."
      );

    } catch (error) {

      console.error(
        "❌ Expiry notification system error:",
        error
      );
    }
  };
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

        const vehiclesWithDocuments = await Promise.all(
          vehicleList.map(async (vehicle) => {

            try {

              const [bluebook, insurance, tax] =
                await Promise.all([
                  getBluebook(vehicle.id),
                  getInsurance(vehicle.id),
                  getTax(vehicle.id),
                ]);

              return {
                ...vehicle,

                // Document expiry information
                bluebookExpiry:
                  bluebook?.expiryDate || null,

                insuranceExpiry:
                  insurance?.validUntil || null,

                taxExpiry:
                  tax?.paidUntil || null,
              };

            } catch (error) {

              console.error(
                "Failed to load vehicle documents:",
                vehicle.id,
                error
              );

              return {
                ...vehicle,
                bluebookExpiry: null,
                insuranceExpiry: null,
                taxExpiry: null,
              };
            }
          })
        );

        setVehicles(vehiclesWithDocuments);

        await createVehicleExpiryNotifications(
          vehiclesWithDocuments
        );
      } catch (error) {
        console.error("Dashboard Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);


  // ==========================================
  // HANDLE DOCUMENT ALERT CLICK
  // ==========================================

  const handleAlertClick = (vehicleId, documentType) => {
    console.log("Vehicle Alert Clicked:", documentType);

    if (!vehicleId) {
      console.error("Vehicle ID is missing");
      return;
    }

    switch (documentType) {
      case "Bluebook":
        navigate(`/vehicle/${vehicleId}/bluebook`);
        break;

      case "Insurance":
        navigate(`/vehicle/${vehicleId}/insurance`);
        break;

      case "Tax":
        navigate(`/vehicle/${vehicleId}/tax`);
        break;

      default:
        console.warn("Unknown document type:", documentType);
    }
  };

  // ==========================================
  // LOADING SCREEN
  // ==========================================

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

      {/* ==========================================
          WELCOME SECTION
      ========================================== */}

      <div className="mb-8">

        <h1 className="text-3xl font-bold text-gray-800">
          {t("welcome")}, {fullName} 👋
        </h1>

        <p className="text-gray-500 mt-2">
          {t("manageYourVehicles")}
        </p>

      </div>



      {/* ==========================================
          VEHICLES SECTION
      ========================================== */}

      <div className="mt-10">

        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {t("myVehicles")}
        </h2>


        {vehicles.length === 0 ? (

          /* ========================================
             NO VEHICLES
          ======================================== */

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
              type="button"
              onClick={() => navigate("/add-vehicle")}
              className="mt-6 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl"
            >
              {t("addYourFirstVehicle")}
            </button>

          </div>

        ) : (

          /* ========================================
             VEHICLE LIST
          ======================================== */

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {vehicles.map((vehicle) => {

              // Calculate document alerts
              const alerts = getVehicleAlerts(vehicle);

              return (

                <div
                  key={vehicle.id}
                  className="bg-white rounded-2xl shadow-sm border p-6"
                >

                  {/* ==================================
                      VEHICLE INFORMATION
                  ================================== */}

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


                  {/* ==================================
                      VEHICLE STATUS
                  ================================== */}

                  <div className="mt-4">

                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${vehicle.status === "Verified"
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

                  {/* ==================================
    VEHICLE HEALTH SUMMARY
================================== */}

                  <div className="mt-4 flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">

                    <div className="flex items-center gap-2">
                      <span className="text-lg">🩺</span>

                      <span className="text-sm font-bold text-blue-800">
                        Vehicle Health
                      </span>
                    </div>

                    {alerts.some(
                      (alert) =>
                        alert.status === "expired" ||
                        alert.status === "today" ||
                        alert.status === "warning"
                    ) ? (

                      <span className="text-xs font-semibold text-orange-600">
                        🟠 Attention Needed
                      </span>

                    ) : (

                      <span className="text-xs font-semibold text-green-600">
                        🟢 Healthy
                      </span>

                    )}

                  </div>

                  {/* ==================================
                      VEHICLE ALERTS
                  ================================== */}

                  {alerts.length > 0 && (

                    <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4">

                      <p className="text-sm font-bold text-gray-800 mb-3">
                        🔔 Vehicle Alerts
                      </p>

                      <div className="space-y-2">

                        {alerts.map((alert) => {

                          // Don't display alerts without a valid date
                          if (alert.status === "unknown") {
                            return null;
                          }

                          const alertIcon =
                            alert.status === "expired"
                              ? "🔴"
                              : alert.status === "warning"
                                ? "🟠"
                                : alert.status === "today"
                                  ? "⚠️"
                                  : "🟢";

                          return (


                            <button
                              key={alert.documentType}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();

                                console.log("ALERT CLICKED:", alert.documentType);

                                handleAlertClick(
                                  vehicle.id,
                                  alert.documentType
                                );
                              }}
                              className={`relative z-50 block w-full text-left p-3 rounded-lg cursor-pointer transition hover:shadow-md ${alert.status === "expired"
                                ? "bg-red-50 text-red-700 hover:bg-red-100"
                                : alert.status === "warning"
                                  ? "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                                  : alert.status === "today"
                                    ? "bg-orange-50 text-orange-700 hover:bg-orange-100"
                                    : "bg-green-50 text-green-700 hover:bg-green-100"
                                }`}
                            >
                              <p className="text-sm font-semibold">
                                {alert.status === "expired"
                                  ? "🔴"
                                  : alert.status === "warning"
                                    ? "🟠"
                                    : alert.status === "today"
                                      ? "⚠️"
                                      : "🟢"}{" "}
                                {alert.documentType}
                              </p>

                              <p className="text-xs mt-1">
                                {alert.message}
                              </p>

                              <p className="text-xs font-semibold mt-2">
                                View document →
                              </p>
                            </button>

                          );
                        })}

                      </div>

                    </div>

                  )}


                  {/* ==================================
                      PENDING STATUS MESSAGE
                  ================================== */}

                  {vehicle.status === "Pending" && (

                    <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4">

                      <p className="text-sm font-semibold text-yellow-800">
                        ⏳ Verification Pending
                      </p>

                      <p className="text-sm text-yellow-700 mt-1">
                        Your vehicle is waiting for Admin verification.
                      </p>

                    </div>

                  )}


                  {/* ==================================
                      VERIFIED STATUS MESSAGE
                  ================================== */}

                  {vehicle.status === "Verified" && (

                    <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4">

                      <p className="text-sm font-semibold text-green-800">
                        ✓ Vehicle Verified
                      </p>

                      <p className="text-sm text-green-700 mt-1">
                        Your vehicle has been successfully verified.
                      </p>

                    </div>

                  )}


                  {/* ==================================
                      REJECTED STATUS MESSAGE
                  ================================== */}

                  {vehicle.status === "Rejected" && (

                    <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">

                      <p className="text-sm font-semibold text-red-800">
                        ✕ Vehicle Rejected
                      </p>

                      <p className="text-xs font-semibold text-red-700 mt-2">
                        Reason
                      </p>

                      <p className="text-sm text-red-700 mt-1">
                        {vehicle.rejectionReason
                          ? vehicle.rejectionReason
                          : "Details not submitted"}
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/add-vehicle/manual?resubmit=${vehicle.id}`
                          )
                        }
                        className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-semibold transition"
                      >
                        🔄 Resubmit Vehicle
                      </button>

                    </div>

                  )}


                  {/* ==================================
                      MANAGE VEHICLE
                  ================================== */}

                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/vehicle/${vehicle.id}`)
                    }
                    className="mt-5 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl"
                  >
                    {t("manageVehicle")}
                  </button>

                </div>

              );

            })}

          </div>

        )}

      </div>


      {/* ==========================================
          ADD ANOTHER VEHICLE
      ========================================== */}

      {vehicles.length > 0 && (

        <div className="mt-8 bg-gray-50 rounded-2xl border p-6 text-center">

          <h3 className="text-xl font-bold">
            + {t("addAnotherVehicle")}
          </h3>

          <p className="text-gray-500 mt-2">
            {t("registerAnotherVehicle")}
          </p>

          <button
            type="button"
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