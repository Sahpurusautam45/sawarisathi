import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from "firebase/firestore";

import { db } from "../../firebase/firebase";

function RecentActivity() {
  const navigate = useNavigate();

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecentActivity = async () => {
      try {
        const activityList = [];

        // ==========================================
        // VEHICLES
        // ==========================================

        const vehiclesQuery = query(
          collection(db, "vehicles"),
          orderBy("updatedAt", "desc"),
          limit(10)
        );

        const vehiclesSnapshot =
          await getDocs(vehiclesQuery);

        vehiclesSnapshot.forEach((vehicleDoc) => {
          const vehicle = vehicleDoc.data();

          if (!vehicle.updatedAt) return;

          let message = "";

          if (vehicle.status === "Verified") {
            message = `✅ Vehicle Verified — ${
              vehicle.vehicleNumber || "Unknown"
            }`;
          } else if (vehicle.status === "Rejected") {
            message = `❌ Vehicle Rejected — ${
              vehicle.vehicleNumber || "Unknown"
            }`;
          } else {
            message = `🕐 Vehicle Pending — ${
              vehicle.vehicleNumber || "Unknown"
            }`;
          }

          activityList.push({
            id: `vehicle-${vehicleDoc.id}`,
            message,
            timestamp: vehicle.updatedAt.toMillis(),

            // Navigation information
            type: "vehicle",
            targetId: vehicleDoc.id,
          });
        });

        // ==========================================
        // VEHICLE REPORTS
        // ==========================================

        const reportsQuery = query(
          collection(db, "vehicleReports"),
          orderBy("reviewedAt", "desc"),
          limit(10)
        );

        const reportsSnapshot =
          await getDocs(reportsQuery);

        reportsSnapshot.forEach((reportDoc) => {
          const report = reportDoc.data();

          const timestamp =
            report.reviewedAt ||
            report.createdAt;

          if (!timestamp) return;

          let message = "";

          if (report.status === "Approved") {
            message = `🚨 Report Approved — ${
              report.vehicleNumber ||
              "Unknown Vehicle"
            }`;
          } else if (
            report.status === "Rejected"
          ) {
            message = `❌ Report Rejected — ${
              report.vehicleNumber ||
              "Unknown Vehicle"
            }`;
          } else {
            message = `🟡 Report Pending — ${
              report.vehicleNumber ||
              "Unknown Vehicle"
            }`;
          }

          activityList.push({
            id: `report-${reportDoc.id}`,
            message,
            timestamp: timestamp.toMillis(),

            // Navigation information
            type: "report",
            targetId: reportDoc.id,
          });
        });

        // ==========================================
        // SORT ALL ACTIVITIES
        // ==========================================

        activityList.sort(
          (a, b) =>
            b.timestamp - a.timestamp
        );

        // ==========================================
        // SHOW LATEST 6 ACTIVITIES
        // ==========================================

        setActivities(
          activityList.slice(0, 6)
        );

      } catch (error) {
        console.error(
          "Recent Activity Error:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadRecentActivity();
  }, []);

  // ==========================================
  // TIME FORMAT
  // ==========================================

  const getTimeAgo = (timestamp) => {
    const difference =
      Date.now() - timestamp;

    const seconds =
      Math.floor(difference / 1000);

    if (seconds < 60) {
      return "Just now";
    }

    const minutes =
      Math.floor(seconds / 60);

    if (minutes < 60) {
      return `${minutes} min ago`;
    }

    const hours =
      Math.floor(minutes / 60);

    if (hours < 24) {
      return `${hours} hr ago`;
    }

    const days =
      Math.floor(hours / 24);

    return `${days} day${
      days > 1 ? "s" : ""
    } ago`;
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-md mt-8 p-6">

        <h2 className="text-xl font-bold">
          📈 Recent Activity
        </h2>

        <p className="text-gray-500 mt-5">
          Loading recent activity...
        </p>

      </div>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="bg-white rounded-2xl shadow-md mt-8 p-6">

      <h2 className="text-xl font-bold">
        📈 Recent Activity
      </h2>

      <div className="mt-5 space-y-4">

        {activities.length === 0 ? (

          <p className="text-gray-500">
            No recent activity.
          </p>

        ) : (

          activities.map((activity) => (

            <div
              key={activity.id}

              onClick={() => {
                // Report activity
                if (
                  activity.type === "report"
                ) {
                  navigate(
                    `/admin/vehicle-reports/${activity.targetId}`
                  );
                }

                // Vehicle activity
                if (
                  activity.type === "vehicle"
                ) {
                  navigate(
                    `/admin/review/${activity.targetId}`
                  );
                }
              }}

              className="flex justify-between items-center border-b pb-3 last:border-b-0 cursor-pointer hover:bg-slate-50 rounded-lg px-3 py-2 transition"
            >

              <span>
                {activity.message}
              </span>

              <span className="text-gray-500 text-sm whitespace-nowrap ml-4">
                {getTimeAgo(
                  activity.timestamp
                )}
              </span>

            </div>

          ))

        )}

      </div>

    </div>
  );
}

export default RecentActivity;