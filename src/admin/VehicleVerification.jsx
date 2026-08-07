import { useEffect, useState } from "react";

import AdminLayout from "../components/admin/AdminLayout";
import DataTable from "../components/admin/DataTable";

import { getPendingVehicles } from "../services/adminService";

import LoadingSpinner from "../components/LoadingSpinner";

function VehicleVerification() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVehicles = async () => {
      try {
        const data = await getPendingVehicles();
        setVehicles(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadVehicles();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  const columns = [
    {
      key: "vehicleNumber",
      label: "Vehicle No.",
    },
    {
      key: "brand",
      label: "Brand",
    },
    {
      key: "vehicleType",
      label: "Type",
    },
    {
      key: "status",
      label: "Status",
    },
  ];

  return (
    <AdminLayout>
      <div>
        <h1 className="text-3xl font-bold">
          🚗 Vehicle Verification
        </h1>

        <p className="text-gray-500 mt-2">
          Review and verify submitted vehicles.
        </p>

        <DataTable
          title="Pending Vehicle Verification"
          subtitle="Vehicles waiting for admin approval"
          columns={columns}
          data={vehicles}
        />
      </div>
    </AdminLayout>
  );
}

export default VehicleVerification;