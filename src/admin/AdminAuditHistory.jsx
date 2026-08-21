import { useEffect, useState } from "react";

import {
  collection,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";

import { db } from "../firebase/firebase";
import AdminLayout from "../components/admin/AdminLayout";
import LoadingSpinner from "../components/LoadingSpinner";

function AdminAuditHistory() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // ==========================================
  // FILTER STATES
  // ==========================================

  const [searchTerm, setSearchTerm] = useState("");

  const [actionFilter, setActionFilter] =
    useState("All");

  const [entityFilter, setEntityFilter] =
    useState("All");

  const [dateFilter, setDateFilter] =
    useState("All");

  // ==========================================
  // LOAD AUDIT HISTORY
  // ==========================================

  useEffect(() => {
    const loadAuditHistory = async () => {
      try {
        const auditQuery = query(
          collection(db, "adminActivity"),
          orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(
          auditQuery
        );

        const activityList =
          snapshot.docs.map((activityDoc) => ({
            id: activityDoc.id,
            ...activityDoc.data(),
          }));

        setActivities(activityList);

      } catch (error) {
        console.error(
          "Audit History Error:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadAuditHistory();
  }, []);

  // ==========================================
  // TIME FORMAT
  // ==========================================

  const formatDate = (timestamp) => {
    if (!timestamp) {
      return "Unknown time";
    }

    if (
      typeof timestamp?.toDate ===
      "function"
    ) {
      return timestamp
        .toDate()
        .toLocaleString();
    }

    const date = new Date(timestamp);

    if (isNaN(date.getTime())) {
      return "Unknown time";
    }

    return date.toLocaleString();
  };

  // ==========================================
  // GET JAVASCRIPT DATE
  // ==========================================

  const getActivityDate = (timestamp) => {
    if (!timestamp) {
      return null;
    }

    if (
      typeof timestamp?.toDate ===
      "function"
    ) {
      return timestamp.toDate();
    }

    const date = new Date(timestamp);

    if (isNaN(date.getTime())) {
      return null;
    }

    return date;
  };

  // ==========================================
  // SEARCH + FILTER
  // ==========================================

  const filteredActivities =
    activities.filter((activity) => {
      // ----------------------------------------
      // SEARCH
      // ----------------------------------------

      const search =
        searchTerm
          .trim()
          .toLowerCase();

      const matchesSearch =
        !search ||
        (activity.vehicleNumber || "")
          .toLowerCase()
          .includes(search) ||
        (activity.action || "")
          .toLowerCase()
          .includes(search) ||
        (activity.entityType || "")
          .toLowerCase()
          .includes(search) ||
        (activity.reportType || "")
          .toLowerCase()
          .includes(search) ||
        (activity.reason || "")
          .toLowerCase()
          .includes(search);

      if (!matchesSearch) {
        return false;
      }

      // ----------------------------------------
      // ACTION FILTER
      // ----------------------------------------

      const matchesAction =
        actionFilter === "All" ||
        activity.action === actionFilter;

      if (!matchesAction) {
        return false;
      }

      // ----------------------------------------
      // ENTITY FILTER
      // ----------------------------------------

      const matchesEntity =
        entityFilter === "All" ||
        activity.entityType === entityFilter;

      if (!matchesEntity) {
        return false;
      }

      // ----------------------------------------
      // DATE FILTER
      // ----------------------------------------

      if (dateFilter !== "All") {
        const activityDate =
          getActivityDate(
            activity.createdAt
          );

        if (!activityDate) {
          return false;
        }

        const now = new Date();

        if (dateFilter === "Today") {
          const startOfToday =
            new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate()
            );

          if (
            activityDate <
            startOfToday
          ) {
            return false;
          }
        }

        if (dateFilter === "7") {
          const sevenDaysAgo =
            new Date(now);

          sevenDaysAgo.setDate(
            now.getDate() - 7
          );

          if (
            activityDate <
            sevenDaysAgo
          ) {
            return false;
          }
        }

        if (dateFilter === "30") {
          const thirtyDaysAgo =
            new Date(now);

          thirtyDaysAgo.setDate(
            now.getDate() - 30
          );

          if (
            activityDate <
            thirtyDaysAgo
          ) {
            return false;
          }
        }
      }

      return true;
    });

  // ==========================================
  // CLEAR FILTERS
  // ==========================================

  const clearFilters = () => {
    setSearchTerm("");
    setActionFilter("All");
    setEntityFilter("All");
    setDateFilter("All");
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return <LoadingSpinner />;
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <AdminLayout>

      <div className="space-y-8">

        {/* ======================================
            HEADER
        ====================================== */}

        <div>

          <h1 className="text-3xl font-bold">
            📜 Admin Activity
          </h1>

          <p className="text-gray-500 mt-2">
            Complete history of administrative
            actions in SawariSathi.
          </p>

        </div>


        {/* ======================================
            ACTIVITY PANEL
        ====================================== */}

        <div className="bg-white rounded-2xl shadow-md p-6">

          {/* ====================================
              SEARCH
          ==================================== */}

          <div className="mb-5">

            <input
              type="text"
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(
                  e.target.value
                )
              }
              placeholder="🔍 Search vehicle, action, report type, reason..."
              className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />

          </div>


          {/* ====================================
              FILTERS
          ==================================== */}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">

            {/* ACTION */}

            <div>

              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Action
              </label>

              <select
                value={actionFilter}
                onChange={(e) =>
                  setActionFilter(
                    e.target.value
                  )
                }
                className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-blue-500"
              >

                <option value="All">
                  All Actions
                </option>

                <option value="Vehicle Verified">
                  Vehicle Verified
                </option>

                <option value="Vehicle Rejected">
                  Vehicle Rejected
                </option>

                <option value="Report Approved">
                  Report Approved
                </option>

                <option value="Report Rejected">
                  Report Rejected
                </option>

              </select>

            </div>


            {/* ENTITY */}

            <div>

              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Type
              </label>

              <select
                value={entityFilter}
                onChange={(e) =>
                  setEntityFilter(
                    e.target.value
                  )
                }
                className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-blue-500"
              >

                <option value="All">
                  All Types
                </option>

                <option value="vehicle">
                  Vehicle
                </option>

                <option value="report">
                  Report
                </option>

              </select>

            </div>


            {/* DATE */}

            <div>

              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date
              </label>

              <select
                value={dateFilter}
                onChange={(e) =>
                  setDateFilter(
                    e.target.value
                  )
                }
                className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-blue-500"
              >

                <option value="All">
                  All Time
                </option>

                <option value="Today">
                  Today
                </option>

                <option value="7">
                  Last 7 Days
                </option>

                <option value="30">
                  Last 30 Days
                </option>

              </select>

            </div>

          </div>


          {/* ====================================
              FILTER SUMMARY
          ==================================== */}

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">

            <p className="text-sm text-gray-500">

              Showing{" "}
              <span className="font-semibold text-gray-800">
                {filteredActivities.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-gray-800">
                {activities.length}
              </span>{" "}
              activities

            </p>


            <button
              onClick={clearFilters}
              className="text-sm font-semibold text-blue-600 hover:text-blue-800"
            >
              Clear Filters
            </button>

          </div>


          {/* ====================================
              ACTIVITY LIST
          ==================================== */}

          {filteredActivities.length === 0 ? (

            <div className="text-center py-12">

              <div className="text-4xl mb-3">
                🔎
              </div>

              <p className="text-gray-500">
                No activity found.
              </p>

              <button
                onClick={clearFilters}
                className="mt-4 text-blue-600 font-semibold hover:underline"
              >
                Clear filters
              </button>

            </div>

          ) : (

            <div className="space-y-4">

              {filteredActivities.map(
                (activity) => (

                  <div
                    key={activity.id}
                    className="border rounded-xl p-5 hover:shadow-sm transition"
                  >

                    {/* ==============================
                        HEADER
                    ============================== */}

                    <div className="flex justify-between items-start gap-4">

                      <div>

                        <h2 className="font-bold text-lg">
                          {activity.action ||
                            "Unknown Action"}
                        </h2>

                        <p className="text-sm text-gray-500 mt-1 capitalize">
                          {activity.entityType ||
                            "Unknown Type"}
                        </p>

                      </div>


                      <span className="text-sm text-gray-500 whitespace-nowrap">

                        {formatDate(
                          activity.createdAt
                        )}

                      </span>

                    </div>


                    {/* ==============================
                        VEHICLE
                    ============================== */}

                    {activity.vehicleNumber && (

                      <p className="mt-4">

                        <strong>
                          Vehicle:
                        </strong>{" "}

                        {activity.vehicleNumber}

                      </p>

                    )}


                    {/* ==============================
                        REPORT TYPE
                    ============================== */}

                    {activity.reportType && (

                      <p className="mt-2">

                        <strong>
                          Report Type:
                        </strong>{" "}

                        {activity.reportType}

                      </p>

                    )}


                    {/* ==============================
                        REASON
                    ============================== */}

                    {activity.reason && (

                      <p className="mt-2 text-red-600">

                        <strong>
                          Reason:
                        </strong>{" "}

                        {activity.reason}

                      </p>

                    )}

                  </div>

                )
              )}

            </div>

          )}

        </div>

      </div>

    </AdminLayout>
  );
}

export default AdminAuditHistory;