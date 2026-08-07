import {
  Users,
  Car,
  Clock,
  BadgeCheck,
} from "lucide-react";

import StatCard from "../components/admin/StatCard";
import AdminTopbar from "../components/admin/AdminTopbar";
import DataTable from "../components/admin/DataTable";
import RecentActivity from "../components/admin/RecentActivity";
import AdminSidebar from "../components/admin/AdminSidebar";


function AdminDashboard() {
  return (
    <div className="flex bg-slate-100 min-h-screen">

      <AdminSidebar />

      <main className="flex-1 p-8">
        <AdminTopbar />
        <DataTable />
        <RecentActivity />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-8">

        <StatCard
          title="Total Users"
          value="0"
          icon={<Users size={28} />}
          color="bg-blue-600"
        />

        <StatCard
          title="Vehicles"
          value="0"
          icon={<Car size={28} />}
          color="bg-green-600"
        />

        <StatCard
          title="Pending"
          value="0"
          icon={<Clock size={28} />}
          color="bg-yellow-500"
        />

        <StatCard
          title="Verified"
          value="0"
          icon={<BadgeCheck size={28} />}
          color="bg-purple-600"
        />

      </div>  

      </main>

    </div>
  );
}

export default AdminDashboard;