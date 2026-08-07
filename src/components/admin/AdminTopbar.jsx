import { Bell, Search, UserCircle } from "lucide-react";

function AdminTopbar() {
  return (
    <div className="bg-white rounded-2xl shadow-md p-5 flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold">
          👨‍💼 Admin Dashboard
        </h2>

        <p className="text-gray-500 text-sm">
          Welcome to the SawariSathi Control Center
        </p>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 rounded-lg hover:bg-gray-100">
          <Bell size={22} />
        </button>

        <button className="p-2 rounded-lg hover:bg-gray-100">
          <Search size={22} />
        </button>

        <div className="flex items-center gap-2">
          <UserCircle size={34} />

          <div>
            <p className="font-semibold">Admin</p>
            <p className="text-sm text-gray-500">SawariSathi</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminTopbar;