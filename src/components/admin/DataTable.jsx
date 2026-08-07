function DataTable() {
  return (
    <div className="bg-white rounded-2xl shadow-md mt-8 overflow-hidden">

      <div className="p-6 border-b">
        <h2 className="text-xl font-bold">
          📋 Pending Vehicle Verification
        </h2>

        <p className="text-gray-500 text-sm mt-1">
          Vehicles waiting for admin approval
        </p>
      </div>

      <table className="w-full">

        <thead className="bg-gray-100">

          <tr>

            <th className="text-left p-4">Vehicle No.</th>

            <th className="text-left p-4">Owner</th>

            <th className="text-left p-4">Status</th>

            <th className="text-left p-4">Action</th>

          </tr>

        </thead>

        <tbody>

          <tr className="border-t">

            <td className="p-4">SA 2 PA 9808</td>

            <td className="p-4">Purusautam Sah</td>

            <td className="p-4">
              <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm">
                Pending
              </span>
            </td>

            <td className="p-4">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Review
              </button>
            </td>

          </tr>

        </tbody>

      </table>

    </div>
  );
}

export default DataTable;