import AdminSidebar from "../components/admin/AdminSidebar";

function AdminDashboard() {
  return (
    <div className="flex bg-slate-100 min-h-screen">

      <AdminSidebar />

      <main className="flex-1 p-8">

        <h1 className="text-3xl font-bold">
          👨‍💼 Admin Dashboard
        </h1>

        <p className="text-gray-500 mt-2">
          Welcome to the SawariSathi Control Center
        </p>

      </main>

    </div>
  );
}

export default AdminDashboard;