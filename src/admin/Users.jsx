import { useEffect, useState } from "react";

import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "../firebase/firebase";

import AdminLayout from "../components/admin/AdminLayout";


function Users() {

  // ==========================================
  // USERS
  // ==========================================

  const [users, setUsers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);


  // ==========================================
  // VEHICLES
  // ==========================================

  const [userVehicles, setUserVehicles] =
    useState({});

  const [vehicleLoading, setVehicleLoading] =
    useState({});

  const [expandedUser, setExpandedUser] =
    useState(null);


  // ==========================================
  // LOAD USERS
  // ==========================================

  useEffect(() => {

    const loadUsers = async () => {

      try {

        setLoading(true);


        const usersRef =
          collection(
            db,
            "users"
          );


        const snapshot =
          await getDocs(
            usersRef
          );


        const usersData =
          snapshot.docs.map(
            (userDoc) => ({
              id: userDoc.id,
              ...userDoc.data(),
            })
          );


        setUsers(
          usersData
        );

      } catch (error) {

        console.error(
          "Users Load Error:",
          error
        );

      } finally {

        setLoading(false);

      }

    };


    loadUsers();

  }, []);


  // ==========================================
  // LOAD VEHICLES FOR USER
  // ==========================================

  const loadUserVehicles = async (
    userId
  ) => {

    try {

      setVehicleLoading(
        (prev) => ({
          ...prev,
          [userId]: true,
        })
      );


      const vehiclesQuery =
        query(
          collection(
            db,
            "vehicles"
          ),
          where(
            "ownerId",
            "==",
            userId
          )
        );


      const snapshot =
        await getDocs(
          vehiclesQuery
        );


      const vehiclesData =
        snapshot.docs.map(
          (vehicleDoc) => ({
            id: vehicleDoc.id,
            ...vehicleDoc.data(),
          })
        );


      setUserVehicles(
        (prev) => ({
          ...prev,
          [userId]:
            vehiclesData,
        })
      );


    } catch (error) {

      console.error(
        "User Vehicles Load Error:",
        error
      );


      setUserVehicles(
        (prev) => ({
          ...prev,
          [userId]: [],
        })
      );

    } finally {

      setVehicleLoading(
        (prev) => ({
          ...prev,
          [userId]: false,
        })
      );

    }

  };


  // ==========================================
  // TOGGLE VEHICLES
  // ==========================================

  const handleViewVehicles = async (
    userId
  ) => {

    // Close if already open

    if (
      expandedUser === userId
    ) {

      setExpandedUser(null);

      return;

    }


    setExpandedUser(
      userId
    );


    // Only load once

    if (
      userVehicles[userId]
    ) {

      return;

    }


    await loadUserVehicles(
      userId
    );

  };


  // ==========================================
  // VIEW VEHICLE DETAILS
  // ==========================================

  const handleViewVehicle = (
    vehicleId
  ) => {

    window.location.href =
      `/admin/review/${vehicleId}?mode=view`;

  };


  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {

    return (

      <AdminLayout>

        <div className="bg-white rounded-2xl shadow-md p-8 mt-8 text-center">

          <p className="text-gray-500">
            Loading users...
          </p>

        </div>

      </AdminLayout>

    );

  }


  // ==========================================
  // PAGE
  // ==========================================

  return (

    <AdminLayout>

      <div className="mt-8">


        {/* =====================================
            HEADER
        ===================================== */}

        <div className="bg-white rounded-2xl shadow-md p-6">

          <h2 className="text-2xl font-bold">
            👥 Users
          </h2>

          <p className="text-gray-500 mt-2">
            Manage registered users and view
            their vehicles.
          </p>

        </div>


        {/* =====================================
            USER LIST
        ===================================== */}

        <div className="bg-white rounded-2xl shadow-md mt-6 overflow-hidden">

          {users.length === 0 ? (

            <div className="p-8 text-center">

              <p className="text-gray-500">
                No users found.
              </p>

            </div>

          ) : (

            <div className="divide-y">


              {users.map(
                (user) => (

                  <div
                    key={user.id}
                    className="p-6"
                  >


                    {/* USER INFORMATION */}

                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">


                      <div>

                        <h3 className="text-lg font-bold text-gray-800">

                          {user.fullName ||
                            "Unnamed User"}

                        </h3>


                        <p className="text-gray-500 mt-1">

                          {user.email ||
                            "No email"}

                        </p>


                        <div className="flex flex-wrap gap-2 mt-3">


                          <span className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700">

                            Role:{" "}
                            {user.role ||
                              "user"}

                          </span>


                          <span className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700">

                            🚗{" "}

                            {userVehicles[user.id]
                              ? userVehicles[user.id].length
                              : user.vehicleCount ??
                                "—"}

                            {" "}Vehicle

                            {(
                              userVehicles[user.id]
                                ? userVehicles[user.id].length
                                : user.vehicleCount
                            ) === 1
                              ? ""
                              : "s"}

                          </span>


                        </div>

                      </div>


                      {/* VIEW VEHICLES BUTTON */}

                      <button
                        type="button"
                        onClick={() =>
                          handleViewVehicles(
                            user.id
                          )
                        }
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold transition"
                      >

                        {expandedUser ===
                          user.id
                          ? "▲ Hide Vehicles"
                          : "🚗 View Vehicles"}

                      </button>


                    </div>


                    {/* =================================
                        VEHICLE LIST
                    ================================= */}

                    {expandedUser ===
                      user.id && (

                        <div className="mt-6 border-t pt-6">


                          {vehicleLoading[
                            user.id
                          ] ? (

                            <p className="text-gray-500">
                              Loading vehicles...
                            </p>

                          ) : userVehicles[
                            user.id
                          ]?.length === 0 ? (

                            <div className="bg-gray-50 rounded-xl p-5">

                              <p className="text-gray-500">
                                This user has no
                                vehicles.
                              </p>

                            </div>

                          ) : (

                            <div className="space-y-4">


                              {userVehicles[
                                user.id
                              ].map(
                                (vehicle) => (

                                  <div
                                    key={
                                      vehicle.id
                                    }
                                    className="border rounded-xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                                  >


                                    {/* VEHICLE INFORMATION */}

                                    <div className="flex-1">

                                      <h4 className="font-bold text-lg">

                                        {vehicle.brand ||
                                          "Unknown Brand"}{" "}

                                        {vehicle.model ||
                                          ""}

                                      </h4>


                                      <p className="text-gray-500 mt-1">

                                        {vehicle.vehicleNumber ||
                                          "No vehicle number"}

                                      </p>


                                      <p className="text-gray-500 mt-1">

                                        {vehicle.vehicleType ||
                                          "Vehicle"}

                                        {" • "}

                                        {vehicle.color ||
                                          "No color"}

                                      </p>

                                    </div>


                                    {/* RIGHT SIDE */}

                                    <div className="flex items-center gap-3">

                                      {/* STATUS */}

                                      <span
                                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                                          vehicle.status ===
                                          "Verified"
                                            ? "bg-green-100 text-green-700"
                                            : vehicle.status ===
                                              "Rejected"
                                            ? "bg-red-100 text-red-700"
                                            : "bg-yellow-100 text-yellow-700"
                                        }`}
                                      >

                                        {vehicle.status ||
                                          "Pending"}

                                      </span>


                                      {/* VIEW DETAILS */}

                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleViewVehicle(
                                            vehicle.id
                                          )
                                        }
                                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-4 py-2 rounded-xl font-semibold transition"
                                      >

                                        View Details

                                      </button>

                                    </div>

                                  </div>

                                )
                              )}

                            </div>

                          )}

                        </div>

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


export default Users;