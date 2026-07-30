import { addVehicle } from "../services/vehicleService";
import vehicleBrands from "../data/vehicleBrands";
import { useState } from "react";
function ManualVehicleForm() {
const [vehicleNumber, setVehicleNumber] = useState("");
const [vehicleType, setVehicleType] = useState("");
const [brand, setBrand] = useState("");
const [model, setModel] = useState("");
const [color, setColor] = useState("");
const [selectedBrand, setSelectedBrand] = useState("");
const handleSaveVehicle = async () => {
  try {
    await addVehicle({
      vehicleNumber,
      vehicleType,
      brand: selectedBrand,
      model,
      color,
    });

    alert("Vehicle added successfully!");
  } catch (error) {
    console.error(error);
    alert("Failed to add vehicle.");
  }
};
  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8">

        <h1 className="text-3xl font-bold text-center">
          🚗 Add Vehicle Manually
        </h1>

        <p className="text-center text-gray-500 mt-2">
          Fill in your vehicle details below.
        </p>

        <div className="mt-8 space-y-4">

        <input
         type="text"
         placeholder="Vehicle Number"
         value={vehicleNumber}
         onChange={(e) => setVehicleNumber(e.target.value)}
         className="w-full border rounded-lg p-3"
        />
        
        <select
  value={vehicleType}
  onChange={(e) => setVehicleType(e.target.value)}
  className="w-full border rounded-lg p-3 bg-white"
>
  <option value="">Select Vehicle Type</option>

  <option value="Motorcycle">🏍 Motorcycle</option>
  <option value="Scooter">🛵 Scooter</option>
  <option value="Car">🚗 Car</option>
  <option value="Jeep / SUV">🚙 Jeep / SUV</option>
  <option value="Van">🚐 Van</option>
  <option value="Bus">🚌 Bus</option>
  <option value="Truck">🚚 Truck</option>
  <option value="Tractor">🚜 Tractor</option>
  <option value="Electric Vehicle">⚡ Electric Vehicle</option>
  <option value="Other">🚲 Other</option>
</select>

    <select
      value={selectedBrand}
      onChange={(e) => setSelectedBrand(e.target.value)}
      className="w-full border rounded-lg p-3 bg-white"
    >
      <option value="">Select Brand</option>

      {(vehicleBrands[vehicleType] || []).map((brand) => (
        <option key={brand} value={brand}>
          {brand}
        </option>
      ))}
    </select>

          <input
            type="text"
            placeholder="Model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full border rounded-lg p-3"
          />

          <input
           type="text"
           placeholder="Color"
           value={color}
           onChange={(e) => setColor(e.target.value)}
           className="w-full border rounded-lg p-3"
          />

          <button
            onClick={handleSaveVehicle}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-lg"
          >
            Save Vehicle
          </button>

        </div>

      </div>
    </div>
  );
}

export default ManualVehicleForm;