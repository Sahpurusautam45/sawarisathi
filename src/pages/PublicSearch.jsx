import { useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

import { db } from "../firebase/firebase";
import { useLanguage } from "../context/LanguageContext";

function PublicSearch() {
  const { t } = useLanguage();

  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicle, setVehicle] = useState(null);

  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");


  // ==========================================
  // SEARCH PUBLIC VEHICLE
  // ==========================================

  const handleSearch = async () => {
    console.log("HANDLE SEARCH STARTED");

    const number = vehicleNumber
      .trim()
      .replace(/\s+/g, " ")
      .toUpperCase();

    if (!number) {
      setError("Please enter a vehicle number.");
      return;
    }

    try {
      setLoading(true);
      setSearched(true);
      setError("");
      setVehicle(null);

      // ========================================
      // SEARCH ONLY PUBLIC VEHICLES
      // ========================================

      const vehicleQuery = query(
        collection(db, "publicVehicles"),
        where("vehicleNumber", "==", number)
      );

      const snapshot = await getDocs(vehicleQuery);

      if (snapshot.empty) {
        setError(
          "No publicly verified vehicle found with this vehicle number."
        );
        return;
      }

      const vehicleDoc = snapshot.docs[0];

      const vehicleData = {
        id: vehicleDoc.id,
        ...vehicleDoc.data(),
      };

      // ========================================
      // SAFETY CHECK
      // ========================================

      if (vehicleData.status !== "Verified") {
        setError(
          "This vehicle is not currently publicly verified."
        );
        return;
      }

      setVehicle(vehicleData);

    } catch (error) {
      console.error("Public Search Error:", error);

      setError(
        "Something went wrong while searching."
      );

    } finally {
      setLoading(false);
    }
  };


  // ==========================================
  // DATE FORMATTER
  // ==========================================

  const formatDate = (value) => {
    if (!value) {
      return "Not available";
    }

    if (typeof value?.toDate === "function") {
      return value.toDate().toLocaleDateString();
    }

    const date = new Date(value);

    if (isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString();
  };


  // ==========================================
  // DATE STATUS
  // ==========================================

  const getDateStatus = (dateValue) => {
    if (!dateValue) {
      return "Unknown";
    }

    const date = new Date(dateValue);

    if (isNaN(date.getTime())) {
      return "Unknown";
    }

    return date >= new Date()
      ? "Active"
      : "Expired";
  };


  // ==========================================
  // STATUS STYLE
  // ==========================================

  const getStatusClass = (status) => {
    if (status === "Active") {
      return "bg-green-100 text-green-700";
    }

    if (status === "Expired") {
      return "bg-red-100 text-red-700";
    }

    return "bg-gray-100 text-gray-600";
  };


  // ==========================================
  // VEHICLE AGE
  // ==========================================

  const getVehicleAge = () => {
    if (!vehicle?.registrationDate) {
      return "Not available";
    }

    const date = new Date(
      vehicle.registrationDate
    );

    if (isNaN(date.getTime())) {
      return "Not available";
    }

    const now = new Date();

    let age =
      now.getFullYear() -
      date.getFullYear();

    const monthDifference =
      now.getMonth() -
      date.getMonth();

    if (
      monthDifference < 0 ||
      (
        monthDifference === 0 &&
        now.getDate() < date.getDate()
      )
    ) {
      age--;
    }

    return `${Math.max(age, 0)} years`;
  };


  return (
    <div className="min-h-screen bg-slate-100">

      {/* ======================================
          HEADER
      ====================================== */}

      <div className="bg-white shadow-sm">

        <div className="max-w-6xl mx-auto px-6 py-6">

          <h1 className="text-3xl font-bold">
            🚗 SawariSathi
          </h1>

          <p className="text-gray-500 mt-1">
            Public Vehicle Verification
          </p>

        </div>

      </div>


      {/* ======================================
          SEARCH
      ====================================== */}

      <div className="max-w-4xl mx-auto px-6 py-10">

        <div className="bg-white rounded-2xl shadow-md p-8">

          <h2 className="text-2xl font-bold">
            🔎 Search Vehicle
          </h2>

          <p className="text-gray-500 mt-2">
            Enter a vehicle number to view
            publicly available vehicle information.
          </p>


          <div className="flex flex-col md:flex-row gap-3 mt-6">

            <input
              type="text"
              value={vehicleNumber}
              onChange={(e) =>
                setVehicleNumber(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              placeholder="Enter vehicle number"
              className="flex-1 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              type="button"
              onClick={() => {
                console.log("SEARCH BUTTON CLICKED");
                handleSearch();
              }}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-xl font-semibold cursor-pointer"
            >
              {loading ? "Searching..." : "Search"}
            </button>

          </div>


          {/* ERROR */}

          {error && (

            <div className="mt-5 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
              {error}
            </div>

          )}

        </div>


        {/* ======================================
            RESULT
        ====================================== */}

        {searched && vehicle && (

          <div className="mt-8 space-y-5">


            {/* ==================================
                VERIFICATION HEADER
            ================================== */}

            <div className="bg-white rounded-2xl shadow-md p-6">

              <div className="flex flex-col md:flex-row justify-between gap-4">

                <div>

                  <p className="text-sm text-gray-500">
                    Vehicle Number
                  </p>

                  <h2 className="text-2xl font-bold">
                    {vehicle.vehicleNumber}
                  </h2>

                </div>


                <div className="bg-green-100 text-green-700 px-5 py-3 rounded-xl font-semibold">
                  🟢 Verified Vehicle
                </div>

              </div>

            </div>


            {/* ==================================
                VEHICLE DETAILS
            ================================== */}

            <details
              open
              className="bg-white rounded-2xl shadow-md"
            >

              <summary className="cursor-pointer p-6 text-xl font-bold">
                🚗 Vehicle Details
              </summary>

              <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-4">

                <div className="border rounded-xl p-4">

                  <p className="text-gray-500 text-sm">
                    Vehicle Type
                  </p>

                  <p className="font-semibold mt-1">
                    {vehicle.vehicleType ||
                      "Not available"}
                  </p>

                </div>


                <div className="border rounded-xl p-4">

                  <p className="text-gray-500 text-sm">
                    Brand
                  </p>

                  <p className="font-semibold mt-1">
                    {vehicle.brand ||
                      "Not available"}
                  </p>

                </div>


                <div className="border rounded-xl p-4">

                  <p className="text-gray-500 text-sm">
                    Model
                  </p>

                  <p className="font-semibold mt-1">
                    {vehicle.model ||
                      "Not available"}
                  </p>

                </div>


                <div className="border rounded-xl p-4">

                  <p className="text-gray-500 text-sm">
                    Color
                  </p>

                  <p className="font-semibold mt-1">
                    {vehicle.color ||
                      "Not available"}
                  </p>

                </div>


                <div className="border rounded-xl p-4">

                  <p className="text-gray-500 text-sm">
                    Registration Date
                  </p>

                  <p className="font-semibold mt-1">
                    {formatDate(
                      vehicle.registrationDate
                    )}
                  </p>

                </div>


                <div className="border rounded-xl p-4">

                  <p className="text-gray-500 text-sm">
                    Vehicle Age
                  </p>

                  <p className="font-semibold mt-1">
                    {getVehicleAge()}
                  </p>

                </div>


                <div className="border rounded-xl p-4">

                  <p className="text-gray-500 text-sm">
                    Registration Province
                  </p>

                  <p className="font-semibold mt-1">
                    {vehicle.province ||
                      "Not available"}
                  </p>

                </div>


                <div className="border rounded-xl p-4">

                  <p className="text-gray-500 text-sm">
                    Registration Office
                  </p>

                  <p className="font-semibold mt-1">
                    {vehicle.office ||
                      "Not available"}
                  </p>

                </div>

              </div>

            </details>


            {/* ==================================
                OWNERSHIP
            ================================== */}

            <details
              open
              className="bg-white rounded-2xl shadow-md"
            >

              <summary className="cursor-pointer p-6 text-xl font-bold">
                👤 Ownership
              </summary>

              <div className="px-6 pb-6">

                <div className="border rounded-xl p-5">

                  <p className="text-gray-500 text-sm">
                    Owner
                  </p>

                  <p className="font-semibold mt-1">
                    {vehicle.ownerNameMasked ||
                      "Not available"}
                  </p>

                </div>

                <div className="border rounded-xl p-5 mt-4">

                  <p className="text-gray-500 text-sm">
                    Verification
                  </p>

                  <p className="font-semibold text-green-600 mt-1">
                    🟢 Verified Owner Vehicle
                  </p>

                </div>

              </div>

            </details>


            {/* ==================================
                UNDER THE HOOD
            ================================== */}

            <details className="bg-white rounded-2xl shadow-md">

              <summary className="cursor-pointer p-6 text-xl font-bold">
                🔧 Under the Hood
              </summary>

              <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-4">

                <div className="border rounded-xl p-4">

                  <p className="text-gray-500 text-sm">
                    Engine Capacity
                  </p>

                  <p className="font-semibold mt-1">
                    {vehicle.engineCapacity
                      ? `${vehicle.engineCapacity} cc`
                      : "Not available"}
                  </p>

                </div>


                <div className="border rounded-xl p-4">

                  <p className="text-gray-500 text-sm">
                    Cylinders
                  </p>

                  <p className="font-semibold mt-1">
                    {vehicle.cylinders ||
                      "Not available"}
                  </p>

                </div>


                <div className="border rounded-xl p-4">

                  <p className="text-gray-500 text-sm">
                    Seating Capacity
                  </p>

                  <p className="font-semibold mt-1">
                    {vehicle.seatingCapacity ||
                      "Not available"}
                  </p>

                </div>


                <div className="border rounded-xl p-4">

                  <p className="text-gray-500 text-sm">
                    Fuel Type
                  </p>

                  <p className="font-semibold mt-1">
                    {vehicle.fuelType ||
                      "Not available"}
                  </p>

                </div>

              </div>

            </details>


            {/* ==================================
                ALERTS
            ================================== */}

            <details className="bg-white rounded-2xl shadow-md">

              <summary className="cursor-pointer p-6 text-xl font-bold">
                🚨 Alerts
              </summary>

              <div className="px-6 pb-6 space-y-4">


                {/* STOLEN */}

                <div className="border rounded-xl p-4">

                  <div className="flex justify-between items-center">

                    <p className="font-semibold">
                      🚨 Stolen Status
                    </p>

                    <span
                      className={`px-3 py-1 rounded-full text-sm ${vehicle.stolenStatus ===
                        "Reported Stolen"
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                        }`}
                    >
                      {vehicle.stolenStatus ||
                        "Not Reported"}
                    </span>

                  </div>

                </div>


                {/* INSURANCE */}

                <div className="border rounded-xl p-4">

                  <div className="flex justify-between items-center">

                    <p className="font-semibold">
                      🛡 Insurance
                    </p>

                    <span
                      className={`px-3 py-1 rounded-full text-sm ${getStatusClass(
                        getDateStatus(
                          vehicle.insuranceExpiry
                        )
                      )
                        }`}
                    >
                      {getDateStatus(
                        vehicle.insuranceExpiry
                      )}
                    </span>

                  </div>

                </div>


                {/* TAX */}

                <div className="border rounded-xl p-4">

                  <div className="flex justify-between items-center">

                    <p className="font-semibold">
                      💰 Tax
                    </p>

                    <span
                      className={`px-3 py-1 rounded-full text-sm ${getStatusClass(
                        getDateStatus(
                          vehicle.taxExpiry
                        )
                      )
                        }`}
                    >
                      {getDateStatus(
                        vehicle.taxExpiry
                      )}
                    </span>

                  </div>

                </div>


                {/* BLUEBOOK */}

                <div className="border rounded-xl p-4">

                  <div className="flex justify-between items-center">

                    <p className="font-semibold">
                      📘 Bluebook
                    </p>

                    <span
                      className={`px-3 py-1 rounded-full text-sm ${getStatusClass(
                        getDateStatus(
                          vehicle.bluebookExpiry
                        )
                      )
                        }`}
                    >
                      {getDateStatus(
                        vehicle.bluebookExpiry
                      )}
                    </span>

                  </div>

                </div>

              </div>

            </details>


            {/* ==================================
                IMPORTANT DATES
            ================================== */}

            <details className="bg-white rounded-2xl shadow-md">

              <summary className="cursor-pointer p-6 text-xl font-bold">
                📅 Important Dates
              </summary>

              <div className="px-6 pb-6 space-y-4">


                <div className="border rounded-xl p-4">

                  <p className="text-gray-500 text-sm">
                    Registration Date
                  </p>

                  <p className="font-semibold mt-1">
                    {formatDate(
                      vehicle.registrationDate
                    )}
                  </p>

                </div>


                <div className="border rounded-xl p-4">

                  <p className="text-gray-500 text-sm">
                    Bluebook Expiry
                  </p>

                  <p className="font-semibold mt-1">
                    {formatDate(
                      vehicle.bluebookExpiry
                    )}
                  </p>

                </div>


                <div className="border rounded-xl p-4">

                  <p className="text-gray-500 text-sm">
                    Insurance Valid Until
                  </p>

                  <p className="font-semibold mt-1">
                    {formatDate(
                      vehicle.insuranceExpiry
                    )}
                  </p>

                </div>


                <div className="border rounded-xl p-4">

                  <p className="text-gray-500 text-sm">
                    Tax Paid Until
                  </p>

                  <p className="font-semibold mt-1">
                    {formatDate(
                      vehicle.taxExpiry
                    )}
                  </p>

                </div>

              </div>

            </details>

          </div>

        )}

      </div>

    </div>
  );
}

export default PublicSearch;