import { useEffect, useState } from "react";

import AdminLayout from "../components/admin/AdminLayout";
import DataTable from "../components/admin/DataTable";

import {
  getPendingVehicles,
  syncVerifiedVehiclesToPublic,
} from "../services/adminService";

import LoadingSpinner from "../components/LoadingSpinner";

function VehicleVerification() {
  const [vehicles, setVehicles] = useState([]);

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {

    const handleSyncVerifiedVehicles = async () => {
      const confirmed = window.confirm(
        "Sync all verified vehicles to public search?"
      );

      if (!confirmed) return;

      try {
        setSyncing(true);

        const result =
          await syncVerifiedVehiclesToPublic();

        alert(
          `${result.syncedCount} verified vehicle(s) synced successfully.`
        );

      } catch (error) {
        console.error(
          "Vehicle Sync Error:",
          error
        );

        alert(
          "Failed to sync verified vehicles."
        );

      } finally {
        setSyncing(false);
      }
    };
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

  // ==========================================
  // SYNC VERIFIED VEHICLES TO PUBLIC SEARCH
  // ==========================================

  const handleSyncVerifiedVehicles = async () => {
    const confirmed = window.confirm(
      "Sync all verified vehicles to public search?"
    );

    if (!confirmed) return;

    try {
      setSyncing(true);

      const result =
        await syncVerifiedVehiclesToPublic();

      alert(
        `${result.syncedCount} verified vehicle(s) synced successfully.`
      );
    } catch (error) {
      console.error(
        "Vehicle Sync Error:",
        error
      );

      alert(
        "Failed to sync verified vehicles."
      );
    } finally {
      setSyncing(false);
    }
  };

  return (
    <AdminLayout>
      <div>
        <h1 className="text-3xl font-bold">
          🚗 Vehicle Verification
        </h1>

        <p className="text-gray-500 mt-2">
          Review and verify submitted vehicles.
        </p>

        <div className="mt-6">

          <button
            onClick={handleSyncVerifiedVehicles}
            disabled={syncing}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-xl font-semibold"
          >
            {syncing
              ? "Syncing Vehicles..."
              : "🔄 Sync Verified Vehicles"}
          </button>

        </div>

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