import AdminLayout from "../components/admin/AdminLayout";

function Users() {
  return (
    <AdminLayout>
      <div className="bg-white rounded-2xl shadow-md p-6 mt-8">
        <h2 className="text-2xl font-bold">
          👥 Users
        </h2>

        <p className="text-gray-500 mt-2">
          Manage registered users.
        </p>
      </div>
    </AdminLayout>
  );
}

export default Users;