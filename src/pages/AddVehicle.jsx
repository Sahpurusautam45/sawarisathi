import { useNavigate } from "react-router-dom";

function AddVehicle() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-5xl mx-auto">

        <h1 className="text-4xl font-bold text-center">
          🚗 Add Your Vehicle
        </h1>

        <p className="text-center text-gray-500 mt-3">
          Choose how you'd like to add your vehicle.
        </p>

        <div className="grid md:grid-cols-3 gap-6 mt-12">

          {/* Manual */}
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition">
            <div className="text-5xl">➕</div>

            <h2 className="text-2xl font-bold mt-4">
              Add Manually
            </h2>

            <p className="text-gray-500 mt-3">
              Enter your vehicle details manually.
            </p>

            <button
              onClick={() => navigate("/add-vehicle/manual")}
              className="mt-6 bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-xl"
            >
              Continue
            </button>
          </div> {/* <--- Added missing closing div here */}

          {/* Scan */}
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center opacity-70">

            <div className="text-5xl">📷</div>

            <h2 className="text-2xl font-bold mt-4">
              Scan Bluebook
            </h2>

            <p className="text-gray-500 mt-3">
              Automatically fill vehicle details.
            </p>

            <button
              disabled
              className="mt-6 bg-gray-400 text-white px-6 py-3 rounded-xl cursor-not-allowed"
            >
              Coming Soon
            </button>

          </div>

          {/* Claim */}
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center opacity-70">

            <div className="text-5xl">✔</div>

            <h2 className="text-2xl font-bold mt-4">
              Claim My Vehicle
            </h2>

            <p className="text-gray-500 mt-3">
              Link your vehicle after official verification.
            </p>

            <button
              disabled
              className="mt-6 bg-gray-400 text-white px-6 py-3 rounded-xl cursor-not-allowed"
            >
              Coming Soon
            </button>

          </div>

        </div>

      </div>
    </div>
  );
}

export default AddVehicle;