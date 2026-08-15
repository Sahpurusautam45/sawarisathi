import { addVehicle } from "../services/vehicleService";
import vehicleBrands from "../data/vehicleBrands";
import { useState } from "react";

function ManualVehicleForm() {
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [color, setColor] = useState("");

  // New vehicle information
  const [engineCapacity, setEngineCapacity] = useState("");
  const [cylinders, setCylinders] = useState("");
  const [seatingCapacity, setSeatingCapacity] = useState("");
  const [fuelType, setFuelType] = useState("");

  const [selectedBrand, setSelectedBrand] = useState("");

  const handleSaveVehicle = async () => {
    try {
      if (!vehicleNumber || !vehicleType || !selectedBrand || !model) {
        alert("Please fill in the required vehicle details.");
        return;
      }

      await addVehicle({
        vehicleNumber: vehicleNumber
          .trim()
          .replace(/\s+/g, " ")
          .toUpperCase(),

        vehicleType,

        brand: selectedBrand,

        model,

        color,

        // New public-safe vehicle information
        engineCapacity,
        cylinders,
        seatingCapacity,
        fuelType,
      });

      alert("Vehicle added successfully!");

      // Clear form after successful save
      setVehicleNumber("");
      setVehicleType("");
      setSelectedBrand("");
      setModel("");
      setColor("");
      setEngineCapacity("");
      setCylinders("");
      setSeatingCapacity("");
      setFuelType("");

    } catch (error) {
      console.error(error);
      alert("Failed to add vehicle.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8">

      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8">

        {/* ======================================
            HEADER
        ====================================== */}

        <h1 className="text-3xl font-bold text-center">
          🚗 Add Vehicle Manually
        </h1>

        <p className="text-center text-gray-500 mt-2">
          Fill in your vehicle details below.
        </p>


        <div className="mt-8 space-y-4">

          {/* ======================================
              VEHICLE NUMBER
          ====================================== */}

          <input
            type="text"
            placeholder="Vehicle Number"
            value={vehicleNumber}
            onChange={(e) =>
              setVehicleNumber(e.target.value)
            }
            className="w-full border rounded-lg p-3"
          />


          {/* ======================================
              VEHICLE TYPE
          ====================================== */}

          <select
            value={vehicleType}
            onChange={(e) =>
              setVehicleType(e.target.value)
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
              setSelectedBrand(e.target.value)
            }
            className="w-full border rounded-lg p-3 bg-white"
          >
            <option value="">
              Select Brand
            </option>

            {(vehicleBrands[vehicleType] || []).map(
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
              setModel(e.target.value)
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
              setColor(e.target.value)
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
              onChange={(e) => setEngineCapacity(e.target.value)}
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
                setCylinders(e.target.value)
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
                setSeatingCapacity(e.target.value)
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
                setFuelType(e.target.value)
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
              SAVE
          ====================================== */}

          <button
            type="button"
            onClick={handleSaveVehicle}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-lg font-semibold"
          >
            Save Vehicle
          </button>

        </div>

      </div>

    </div>
  );
}

export default ManualVehicleForm;