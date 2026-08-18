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

  // ==========================================
  // LOAD ADMIN ACTIVITY
  // ==========================================

  useEffect(() => {
    const loadRecentActivity = async () => {
      try {
        const activityQuery = query(
          collection(db, "adminActivity"),
          orderBy("createdAt", "desc"),
          limit(6)
        );

        const snapshot = await getDocs(
          activityQuery
        );

        const activityList = snapshot.docs.map(
          (activityDoc) => {
            const activity =
              activityDoc.data();

            return {
              id: activityDoc.id,

              action:
                activity.action ||
                "Admin Activity",

              entityType:
                activity.entityType || "",

              entityId:
                activity.entityId || "",

              vehicleNumber:
                activity.vehicleNumber ||
                "Unknown Vehicle",

              reportType:
                activity.reportType || null,

              reason:
                activity.reason || null,

              timestamp:
                activity.createdAt
                  ? activity.createdAt.toMillis()
                  : Date.now(),
            };
          }
        );

        setActivities(activityList);

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
  // ACTIVITY MESSAGE
  // ==========================================

  const getActivityMessage = (
    activity
  ) => {

    if (
      activity.action ===
      "Vehicle Verified"
    ) {
      return `✅ Vehicle Verified — ${activity.vehicleNumber}`;
    }

    if (
      activity.action ===
      "Vehicle Rejected"
    ) {
      return `❌ Vehicle Rejected — ${activity.vehicleNumber}`;
    }

    if (
      activity.action ===
      "Report Approved"
    ) {
      return `🚨 Report Approved — ${activity.vehicleNumber}`;
    }

    if (
      activity.action ===
      "Report Rejected"
    ) {
      return `❌ Report Rejected — ${activity.vehicleNumber}`;
    }

    return `📋 ${activity.action}`;
  };

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

                // ==================================
                // REPORT
                // ==================================

                if (
                  activity.entityType ===
                  "report"
                ) {
                  navigate(
                    `/admin/vehicle-reports/${activity.entityId}`
                  );

                  return;
                }

                // ==================================
                // VEHICLE
                // ==================================

                if (
                  activity.entityType ===
                  "vehicle"
                ) {
                  navigate(
                    `/admin/review/${activity.entityId}`
                  );
                }

              }}

              className="flex justify-between items-center border-b pb-3 last:border-b-0 cursor-pointer hover:bg-slate-50 rounded-lg px-3 py-2 transition"
            >

              <div>

                <span className="font-medium">
                  {getActivityMessage(
                    activity
                  )}
                </span>

                {/* Report Type */}

                {activity.reportType && (
                  <p className="text-sm text-gray-500 mt-1">
                    {activity.reportType}
                  </p>
                )}

                {/* Rejection Reason */}

                {activity.reason && (
                  <p className="text-sm text-red-500 mt-1">
                    Reason: {activity.reason}
                  </p>
                )}

              </div>

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