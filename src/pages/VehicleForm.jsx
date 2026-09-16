import {
  addVehicle,
  updateVehicle,
} from "../services/vehicleService";

import vehicleBrands from "../data/vehicleBrands";

import {
  useState,
  useEffect,
} from "react";

import {
  useSearchParams,
  useNavigate,
} from "react-router-dom";

import {
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";

import {
  db,
  auth,
} from "../firebase/firebase";


function ManualVehicleForm() {

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const resubmitVehicleId =
    searchParams.get("resubmit");

  const isResubmitMode =
    Boolean(resubmitVehicleId);


  // ==========================================
  // VEHICLE FORM STATE
  // ==========================================

  const [vehicleNumber, setVehicleNumber] =
    useState("");

  const [vehicleType, setVehicleType] =
    useState("");

  const [selectedBrand, setSelectedBrand] =
    useState("");

  const [model, setModel] =
    useState("");

  const [color, setColor] =
    useState("");


  // ==========================================
  // VEHICLE SPECIFICATIONS
  // ==========================================

  const [engineCapacity, setEngineCapacity] =
    useState("");

  const [cylinders, setCylinders] =
    useState("");

  const [seatingCapacity, setSeatingCapacity] =
    useState("");

  const [fuelType, setFuelType] =
    useState("");


  // ==========================================
  // RESUBMISSION STATE
  // ==========================================

  const [loadingVehicle, setLoadingVehicle] =
    useState(false);

  const [previousRejectionReason, setPreviousRejectionReason] =
    useState("");


  // ==========================================
  // LOAD VEHICLE FOR RESUBMISSION
  // ==========================================

  useEffect(() => {

    if (!resubmitVehicleId) {
      return;
    }


    const loadVehicleForResubmit =
      async () => {

        try {

          setLoadingVehicle(true);


          const user =
            auth.currentUser;


          if (!user) {

            alert(
              "Please login to resubmit your vehicle."
            );

            navigate("/login");

            return;
          }


          // ======================================
          // GET VEHICLE
          // ======================================

          const vehicleRef = doc(
            db,
            "vehicles",
            resubmitVehicleId
          );


          const vehicleSnap =
            await getDoc(vehicleRef);


          if (!vehicleSnap.exists()) {

            alert(
              "Vehicle could not be found."
            );

            navigate("/dashboard");

            return;
          }


          const vehicle =
            vehicleSnap.data();


          // ======================================
          // VERIFY OWNER
          // ======================================

          if (
            vehicle.ownerId !==
            user.uid
          ) {

            alert(
              "You are not authorized to resubmit this vehicle."
            );

            navigate("/dashboard");

            return;
          }


          // ======================================
          // ONLY REJECTED VEHICLES
          // ======================================

          if (
            vehicle.status !==
            "Rejected"
          ) {

            alert(
              "Only rejected vehicles can be resubmitted."
            );

            navigate("/dashboard");

            return;
          }


          // ======================================
          // LOAD EXISTING INFORMATION
          // ======================================

          setVehicleNumber(
            vehicle.vehicleNumber || ""
          );


          setVehicleType(
            vehicle.vehicleType || ""
          );


          setSelectedBrand(
            vehicle.brand || ""
          );


          setModel(
            vehicle.model || ""
          );


          setColor(
            vehicle.color || ""
          );


          setEngineCapacity(
            vehicle.engineCapacity || ""
          );


          setCylinders(
            vehicle.cylinders || ""
          );


          setSeatingCapacity(
            vehicle.seatingCapacity || ""
          );


          setFuelType(
            vehicle.fuelType || ""
          );


          // ======================================
          // PRESERVE OLD REJECTION REASON
          // ======================================

          setPreviousRejectionReason(
            vehicle.rejectionReason || ""
          );

        } catch (error) {

          console.error(
            "Load Resubmit Vehicle Error:",
            error
          );


          alert(
            "Failed to load vehicle information."
          );

        } finally {

          setLoadingVehicle(false);

        }

      };


    loadVehicleForResubmit();

  }, [
    resubmitVehicleId,
    navigate,
  ]);


  // ==========================================
  // SAVE / RESUBMIT VEHICLE
  // ==========================================

  const handleSaveVehicle =
    async () => {

      try {

        // ========================================
        // VALIDATION
        // ========================================

        if (
          !vehicleNumber ||
          !vehicleType ||
          !selectedBrand ||
          !model
        ) {

          alert(
            "Please fill in the required vehicle details."
          );

          return;
        }


        // ========================================
        // RESUBMIT MODE
        // ========================================

        if (isResubmitMode) {


          await updateVehicle(
            resubmitVehicleId,
            {

              vehicleNumber:
                vehicleNumber
                  .trim()
                  .replace(/\s+/g, " ")
                  .toUpperCase(),

              vehicleType,

              brand:
                selectedBrand,

              model,

              color,

              engineCapacity,

              cylinders,

              seatingCapacity,

              fuelType,


              // ==================================
              // RESUBMISSION STATUS
              // ==================================

              status:
                "Pending",

              resubmitted:
                true,

              resubmittedAt:
                serverTimestamp(),


              // ==================================
              // PRESERVE OLD REJECTION
              // ==================================

              previousRejectionReason:
                previousRejectionReason,


              // Current rejection cleared
              // because Admin will review again.

              rejectionReason:
                "",


              // ==================================
              // ADMIN REVIEW RESET
              // ==================================

              remarks:
                "Vehicle resubmitted for Admin recheck.",

              verifiedBy:
                "",

              verifiedAt:
                null,

            }
          );


          alert(
            "🔄 Vehicle resubmitted successfully. It is now pending Admin recheck."
          );


          navigate(
            "/dashboard"
          );


          return;
        }


        // ========================================
        // NORMAL ADD VEHICLE
        // ========================================

        await addVehicle({

          vehicleNumber:
            vehicleNumber
              .trim()
              .replace(/\s+/g, " ")
              .toUpperCase(),

          vehicleType,

          brand:
            selectedBrand,

          model,

          color,

          engineCapacity,

          cylinders,

          seatingCapacity,

          fuelType,

        });


        alert(
          "Vehicle added successfully!"
        );


        // ========================================
        // SUCCESS → GO TO DASHBOARD
        // ========================================

        navigate("/dashboard");

        return;

      } catch (error) {

        console.error(
          "Save vehicle error:",
          error
        );


        // ========================================
        // DUPLICATE VEHICLE
        // ========================================

        if (
          error?.message ===
          "VEHICLE_ALREADY_REGISTERED"
        ) {

          alert(
            "🚨 This vehicle is already registered in SawariSathi."
          );

          return;
        }


        // ========================================
        // GENERAL ERROR
        // ========================================

        alert(
          isResubmitMode
            ? "Failed to resubmit vehicle. Please try again."
            : "Failed to add vehicle. Please try again."
        );

      }

    };


  // ==========================================
  // LOADING SCREEN
  // ==========================================

  if (
    isResubmitMode &&
    loadingVehicle
  ) {

    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">

        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">

          <div className="text-4xl">
            🔄
          </div>

          <p className="mt-4 text-gray-600">
            Loading your vehicle information...
          </p>

        </div>

      </div>
    );

  }


  // ==========================================
  // PAGE
  // ==========================================

  return (

    <div className="min-h-screen bg-slate-100 p-8">

      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8">


        {/* ======================================
            HEADER
        ====================================== */}

        <h1 className="text-3xl font-bold text-center">

          {isResubmitMode
            ? "🔄 Correct & Resubmit Vehicle"
            : "🚗 Add Vehicle Manually"}

        </h1>


        <p className="text-center text-gray-500 mt-2">

          {isResubmitMode
            ? "Correct the rejected information and submit your vehicle for Admin recheck."
            : "Fill in your vehicle details below."}

        </p>


        {/* ======================================
            PREVIOUS REJECTION
        ====================================== */}

        {isResubmitMode &&
          previousRejectionReason && (

            <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4">

              <p className="font-semibold text-red-800">

                ❌ Previous Rejection Reason

              </p>

              <p className="text-sm text-red-700 mt-1">

                {previousRejectionReason}

              </p>

            </div>

          )}


        <div className="mt-8 space-y-4">


          {/* ======================================
              VEHICLE NUMBER
          ====================================== */}

          <input
            type="text"
            placeholder="Vehicle Number"
            value={vehicleNumber}
            onChange={(e) =>
              setVehicleNumber(
                e.target.value
              )
            }
            className="w-full border rounded-lg p-3"
          />


          {/* ======================================
              VEHICLE TYPE
          ====================================== */}

          <select
            value={vehicleType}
            onChange={(e) =>
              setVehicleType(
                e.target.value
              )
            }
            className="w-full border rounded-lg p-3 bg-white"
          >

            <option value="">
              Select Vehicle Type
            </option>

            <option value="Motorcycle">
              🏍 Motorcycle
            </option>

            <option value="Scooter">
              🛵 Scooter
            </option>

            <option value="Car">
              🚗 Car
            </option>

            <option value="Jeep / SUV">
              🚙 Jeep / SUV
            </option>

            <option value="Van">
              🚐 Van
            </option>

            <option value="Bus">
              🚌 Bus
            </option>

            <option value="Truck">
              🚚 Truck
            </option>

            <option value="Tractor">
              🚜 Tractor
            </option>

            <option value="Electric Vehicle">
              ⚡ Electric Vehicle
            </option>

            <option value="Other">
              🚲 Other
            </option>

          </select>


          {/* ======================================
              BRAND
          ====================================== */}

          <select
            value={selectedBrand}
            onChange={(e) =>
              setSelectedBrand(
                e.target.value
              )
            }
            className="w-full border rounded-lg p-3 bg-white"
          >

            <option value="">
              Select Brand
            </option>

            {(
              vehicleBrands[
              vehicleType
              ] || []
            ).map(
              (brand) => (

                <option
                  key={brand}
                  value={brand}
                >
                  {brand}
                </option>

              )
            )}

          </select>


          {/* ======================================
              MODEL
          ====================================== */}

          <input
            type="text"
            placeholder="Model"
            value={model}
            onChange={(e) =>
              setModel(
                e.target.value
              )
            }
            className="w-full border rounded-lg p-3"
          />


          {/* ======================================
              COLOR
          ====================================== */}

          <input
            type="text"
            placeholder="Color"
            value={color}
            onChange={(e) =>
              setColor(
                e.target.value
              )
            }
            className="w-full border rounded-lg p-3"
          />


          {/* ======================================
              ENGINE CAPACITY
          ====================================== */}

          <div>

            <label className="block text-sm font-medium text-gray-600 mb-1">
              Engine Capacity (CC)
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 149.86"
              value={engineCapacity}
              onChange={(e) =>
                setEngineCapacity(
                  e.target.value
                )
              }
              className="w-full border rounded-lg p-3"
            />

          </div>


          {/* ======================================
              CYLINDERS
          ====================================== */}

          <div>

            <label className="block text-sm font-medium text-gray-600 mb-1">
              Number of Cylinders
            </label>

            <input
              type="number"
              min="0"
              placeholder="e.g. 4"
              value={cylinders}
              onChange={(e) =>
                setCylinders(
                  e.target.value
                )
              }
              className="w-full border rounded-lg p-3"
            />

          </div>


          {/* ======================================
              SEATING CAPACITY
          ====================================== */}

          <div>

            <label className="block text-sm font-medium text-gray-600 mb-1">
              Seating Capacity
            </label>

            <input
              type="number"
              min="1"
              placeholder="e.g. 5"
              value={seatingCapacity}
              onChange={(e) =>
                setSeatingCapacity(
                  e.target.value
                )
              }
              className="w-full border rounded-lg p-3"
            />

          </div>


          {/* ======================================
              FUEL TYPE
          ====================================== */}

          <div>

            <label className="block text-sm font-medium text-gray-600 mb-1">
              Fuel Type
            </label>

            <select
              value={fuelType}
              onChange={(e) =>
                setFuelType(
                  e.target.value
                )
              }
              className="w-full border rounded-lg p-3 bg-white"
            >

              <option value="">
                Select Fuel Type
              </option>

              <option value="Petrol">
                Petrol
              </option>

              <option value="Diesel">
                Diesel
              </option>

              <option value="Electric">
                Electric
              </option>

              <option value="Hybrid">
                Hybrid
              </option>

              <option value="CNG">
                CNG
              </option>

              <option value="Other">
                Other
              </option>

            </select>

          </div>


          {/* ======================================
              SAVE / RESUBMIT
          ====================================== */}

          <button
            type="button"
            onClick={
              handleSaveVehicle
            }
            className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-lg font-semibold"
          >

            {isResubmitMode
              ? "🔄 Submit for Recheck"
              : "Save Vehicle"}

          </button>


        </div>

      </div>

    </div>

  );

}


export default ManualVehicleForm;