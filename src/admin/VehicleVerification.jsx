import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

import AdminLayout from "../components/admin/AdminLayout";
import LoadingSpinner from "../components/LoadingSpinner";
import { db } from "../firebase/firebase";

function VehicleVerification() {
  const navigate = useNavigate();

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");

  // ==========================================
  // LOAD ALL VEHICLES
  // ==========================================

  useEffect(() => {
    const loadVehicles = async () => {
      try {
        setLoading(true);

        const vehiclesRef = collection(db, "vehicles");

        const snapshot = await getDocs(vehiclesRef);

        const vehicleList = snapshot.docs.map((vehicleDoc) => ({
          id: vehicleDoc.id,
          ...vehicleDoc.data(),
        }));

        setVehicles(vehicleList);
      } catch (error) {
        console.error("Vehicle Management Error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadVehicles();
  }, []);

  // ==========================================
  // DATE HELPER
  // ==========================================

  const getVehicleDate = (vehicle) => {
    const timestamp =
      vehicle.createdAt ||
      vehicle.updatedAt ||
      vehicle.verifiedAt;

    if (!timestamp) return null;

    if (timestamp?.toDate) {
      return timestamp.toDate();
    }

    if (timestamp instanceof Date) {
      return timestamp;
    }

    const parsedDate = new Date(timestamp);

    if (Number.isNaN(parsedDate.getTime())) {
      return null;
    }

    return parsedDate;
  };

  // ==========================================
  // DATE FILTER
  // ==========================================

  const matchesDateFilter = (vehicle) => {
    if (dateFilter === "All") {
      return true;
    }

    const vehicleDate = getVehicleDate(vehicle);

    if (!vehicleDate) {
      return false;
    }

    const now = new Date();

    if (dateFilter === "Today") {
      return (
        vehicleDate.getFullYear() === now.getFullYear() &&
        vehicleDate.getMonth() === now.getMonth() &&
        vehicleDate.getDate() === now.getDate()
      );
    }

    const difference =
      now.getTime() - vehicleDate.getTime();

    const days =
      difference / (1000 * 60 * 60 * 24);

    if (dateFilter === "7 Days") {
      return days >= 0 && days <= 7;
    }

    if (dateFilter === "30 Days") {
      return days >= 0 && days <= 30;
    }

    return true;
  };

  // ==========================================
  // FILTER VEHICLES
  // ==========================================

  const filteredVehicles = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return vehicles.filter((vehicle) => {
      // STATUS
      const statusMatches =
        statusFilter === "All" ||
        (vehicle.status || "Pending") === statusFilter;

      if (!statusMatches) {
        return false;
      }

      // DATE
      if (!matchesDateFilter(vehicle)) {
        return false;
      }

      // SEARCH
      if (!search) {
        return true;
      }

      const searchableText = [
        vehicle.vehicleNumber,
        vehicle.ownerName,
        vehicle.ownerEmail,
        vehicle.brand,
        vehicle.model,
        vehicle.vehicleType,
        vehicle.color,
        vehicle.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(search);
    });
  }, [
    vehicles,
    searchTerm,
    statusFilter,
    dateFilter,
  ]);

  // ==========================================
  // COUNTS
  // ==========================================

  const totalVehicles = vehicles.length;

  const pendingVehicles = vehicles.filter(
    (vehicle) =>
      (vehicle.status || "Pending") === "Pending"
  ).length;

  const verifiedVehicles = vehicles.filter(
    (vehicle) =>
      vehicle.status === "Verified"
  ).length;

  const rejectedVehicles = vehicles.filter(
    (vehicle) =>
      vehicle.status === "Rejected"
  ).length;

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (vehicle) => {
    const date = getVehicleDate(vehicle);

    if (!date) {
      return "Unknown";
    }

    return date.toLocaleDateString();
  };

  // ==========================================
  // STATUS BADGE
  // ==========================================

  const getStatusBadge = (status) => {
    const actualStatus = status || "Pending";

    if (actualStatus === "Verified") {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700">
          ✓ Verified
        </span>
      );
    }

    if (actualStatus === "Rejected") {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700">
          ✕ Rejected
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-700">
        ⏳ Pending
      </span>
    );
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

        {/* =====================================
            HEADER
        ===================================== */}

        <div>
          <h1 className="text-3xl font-bold">
            🚗 Vehicle Management
          </h1>

          <p className="text-gray-500 mt-2">
            Manage all vehicle registrations in
            SawariSathi.
          </p>
        </div>


        {/* =====================================
            STATISTICS
        ===================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

          {/* TOTAL */}

          <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-blue-500">
            <p className="text-gray-500 text-sm">
              Total Vehicles
            </p>

            <h2 className="text-3xl font-bold mt-2">
              {totalVehicles}
            </h2>
          </div>


          {/* PENDING */}

          <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-yellow-500">
            <p className="text-gray-500 text-sm">
              Pending
            </p>

            <h2 className="text-3xl font-bold mt-2 text-yellow-600">
              {pendingVehicles}
            </h2>
          </div>


          {/* VERIFIED */}

          <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-green-500">
            <p className="text-gray-500 text-sm">
              Verified
            </p>

            <h2 className="text-3xl font-bold mt-2 text-green-600">
              {verifiedVehicles}
            </h2>
          </div>


          {/* REJECTED */}

          <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-red-500">
            <p className="text-gray-500 text-sm">
              Rejected
            </p>

            <h2 className="text-3xl font-bold mt-2 text-red-600">
              {rejectedVehicles}
            </h2>
          </div>

        </div>


        {/* =====================================
            FILTER AREA
        ===================================== */}

        <div className="bg-white rounded-2xl shadow-md p-6">

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* SEARCH */}

            <div className="lg:col-span-1">

              <label className="block text-sm font-semibold text-gray-600 mb-2">
                Search Vehicle
              </label>

              <input
                type="text"
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(e.target.value)
                }
                placeholder="🔎 Vehicle no, owner, brand..."
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />

            </div>


            {/* STATUS */}

            <div>

              <label className="block text-sm font-semibold text-gray-600 mb-2">
                Status
              </label>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value)
                }
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">
                  All Status
                </option>

                <option value="Pending">
                  Pending
                </option>

                <option value="Verified">
                  Verified
                </option>

                <option value="Rejected">
                  Rejected
                </option>
              </select>

            </div>


            {/* DATE */}

            <div>

              <label className="block text-sm font-semibold text-gray-600 mb-2">
                Date
              </label>

              <select
                value={dateFilter}
                onChange={(e) =>
                  setDateFilter(e.target.value)
                }
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">
                  All Dates
                </option>

                <option value="Today">
                  Today
                </option>

                <option value="7 Days">
                  Last 7 Days
                </option>

                <option value="30 Days">
                  Last 30 Days
                </option>
              </select>

            </div>

          </div>


          {/* RESULT COUNT */}

          <div className="mt-5 text-sm text-gray-500">
            Showing{" "}
            <span className="font-semibold text-gray-800">
              {filteredVehicles.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-gray-800">
              {totalVehicles}
            </span>{" "}
            vehicles
          </div>

        </div>


        {/* =====================================
            VEHICLE TABLE
        ===================================== */}

        <div className="bg-white rounded-2xl shadow-md overflow-hidden">

          <div className="p-6 border-b">

            <h2 className="text-xl font-bold">
              All Vehicles
            </h2>

            <p className="text-gray-500 mt-1">
              Complete vehicle registration records.
            </p>

          </div>


          {/* EMPTY */}

          {filteredVehicles.length === 0 ? (

            <div className="p-10 text-center">

              <div className="text-5xl">
                🚗
              </div>

              <h3 className="text-xl font-bold mt-4">
                No vehicles found
              </h3>

              <p className="text-gray-500 mt-2">
                Try changing your search or filters.
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-gray-50 border-b">

                  <tr>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Vehicle
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Owner
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Type
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Status
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Date
                    </th>

                    <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">
                      Action
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {filteredVehicles.map((vehicle) => (

                    <tr
                      key={vehicle.id}
                      className="border-b last:border-b-0 hover:bg-gray-50 transition"
                    >

                      {/* VEHICLE */}

                      <td className="px-6 py-5">

                        <div className="font-bold text-gray-900">
                          {vehicle.vehicleNumber || "—"}
                        </div>

                        <div className="text-sm text-gray-500 mt-1">
                          {vehicle.brand || "Unknown Brand"}{" "}
                          {vehicle.model || ""}
                        </div>

                      </td>


                      {/* OWNER */}

                      <td className="px-6 py-5">

                        <div className="font-medium">
                          {vehicle.ownerName || "Unknown"}
                        </div>

                        <div className="text-sm text-gray-500">
                          {vehicle.ownerEmail || "—"}
                        </div>

                      </td>


                      {/* TYPE */}

                      <td className="px-6 py-5">

                        <div className="text-gray-700">
                          {vehicle.vehicleType || "—"}
                        </div>

                        {vehicle.color && (
                          <div className="text-sm text-gray-500">
                            {vehicle.color}
                          </div>
                        )}

                      </td>


                      {/* STATUS */}

                      <td className="px-6 py-5">
                        {getStatusBadge(vehicle.status)}

                        {vehicle.status === "Rejected" &&
                          vehicle.rejectionReason && (
                            <div className="mt-2 max-w-xs">
                              <p className="text-xs font-semibold text-red-600">
                                Rejection Reason
                              </p>

                              <p className="text-sm text-gray-600 mt-1">
                                {vehicle.rejectionReason}
                              </p>
                            </div>
                          )}
                      </td>


                      {/* DATE */}

                      <td className="px-6 py-5 text-gray-600">
                        {formatDate(vehicle)}
                      </td>


                      {/* ACTION */}

                      <td className="px-6 py-5 text-right">

                        <button
                          onClick={() =>
                            navigate(
                              `/admin/review/${vehicle.id}`
                            )
                          }
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition"
                        >
                          {vehicle.status === "Pending"
                            ? "Review"
                            : "View"}
                        </button>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </div>
    </AdminLayout>
  );
}

export default VehicleVerification;