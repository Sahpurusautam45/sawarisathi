import AdminLayout from "../components/admin/AdminLayout";
import {
  Users,
  Car,
  Clock,
  BadgeCheck,
} from "lucide-react";

import StatCard from "../components/admin/StatCard";
import DataTable from "../components/admin/DataTable";
import RecentActivity from "../components/admin/RecentActivity";
import { useEffect, useState } from "react";
import { getDashboardStats } from "../services/adminService";
import LoadingSpinner from "../components/LoadingSpinner";

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVehicles: 0,
    pendingVehicles: 0,
    verifiedVehicles: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
  

    loadDashboard();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }
  return (
    <AdminLayout>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-8">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={<Users size={28} />}
          color="bg-blue-600"
        />

        <StatCard
          title="Vehicles"
          value={stats.totalVehicles}
          icon={<Car size={28} />}
          color="bg-green-600"
        />

        <StatCard
          title="Pending"
          value={stats.pendingVehicles}
          icon={<Clock size={28} />}
          color="bg-yellow-500"
        />

        <StatCard
          title="Verified"
          value={stats.verifiedVehicles}
          icon={<BadgeCheck size={28} />}
          color="bg-purple-600"
        />
      </div>

      <DataTable />

      <RecentActivity />
    </AdminLayout>
  );
}

export default AdminDashboard;