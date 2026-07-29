function ManualVehicleForm() {
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
            className="w-full border rounded-lg p-3"
          />

          <input
            type="text"
            placeholder="Vehicle Type"
            className="w-full border rounded-lg p-3"
          />

          <input
            type="text"
            placeholder="Brand"
            className="w-full border rounded-lg p-3"
          />

          <input
            type="text"
            placeholder="Model"
            className="w-full border rounded-lg p-3"
          />

          <input
            type="text"
            placeholder="Color"
            className="w-full border rounded-lg p-3"
          />

          <button
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