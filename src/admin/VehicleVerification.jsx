import AdminLayout from "../components/admin/AdminLayout";

function VehicleVerification() {
  return (
    <AdminLayout>
      <div className="bg-white rounded-2xl shadow-md p-6 mt-8">
        <h2 className="text-2xl font-bold">
          🚗 Vehicle Verification
        </h2>

        <p className="text-gray-500 mt-2">
          Review and verify submitted vehicles.
        </p>
      </div>
    </AdminLayout>
  );
}

export default VehicleVerification;