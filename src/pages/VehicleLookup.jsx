function VehicleLookup() {
  return (
    <div className="min-h-screen bg-slate-100 py-16">

      <div className="max-w-4xl mx-auto">

        <h1 className="text-5xl font-bold text-center text-blue-700">
          🚗 Vehicle Lookup
        </h1>

        <p className="text-center text-gray-600 mt-4">
          Search registered vehicles across Nepal.
        </p>

        <div className="mt-10 flex justify-center">

          <input
            type="text"
            placeholder="Enter Vehicle Number"
            className="w-full max-w-lg px-6 py-4 rounded-l-xl border border-gray-300 text-lg focus:outline-none focus:ring-4 focus:ring-blue-300"
          />

          <button className="bg-blue-700 hover:bg-blue-800 text-white px-8 rounded-r-xl transition">
            Search
          </button>

        </div>

      </div>

      <div className="max-w-4xl mx-auto mt-16">

        <h2 className="text-3xl font-bold mb-8">
          Recent Searches
        </h2>

        <div className="space-y-4">

          <div className="bg-white rounded-xl shadow-md p-5 flex justify-between">
            <span>🚗 BA 2 PA 1234</span>
            <span className="text-green-600 font-semibold">
              Verified ✓
            </span>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 flex justify-between">
            <span>🚗 BA 99 PA 2082</span>
            <span className="text-green-600 font-semibold">
              Verified ✓
            </span>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 flex justify-between">
            <span>🚗 LU 3 PA 8899</span>
            <span className="text-yellow-600 font-semibold">
              Pending
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}

export default VehicleLookup;