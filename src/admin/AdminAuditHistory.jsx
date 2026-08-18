import { useEffect, useState } from "react";

import {
    collection,
    getDocs,
    query,
    orderBy,
} from "firebase/firestore";

import { db } from "../firebase/firebase";
import AdminLayout from "../components/admin/AdminLayout";
import LoadingSpinner from "../components/LoadingSpinner";

function AdminAuditHistory() {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    // ==========================================
    // LOAD AUDIT HISTORY
    // ==========================================

    useEffect(() => {
        const loadAuditHistory = async () => {
            try {
                const auditQuery = query(
                    collection(db, "adminActivity"),
                    orderBy("createdAt", "desc")
                );

                const snapshot = await getDocs(
                    auditQuery
                );

                const activityList =
                    snapshot.docs.map((activityDoc) => ({
                        id: activityDoc.id,
                        ...activityDoc.data(),
                    }));

                setActivities(activityList);

            } catch (error) {
                console.error(
                    "Audit History Error:",
                    error
                );
            } finally {
                setLoading(false);
            }
        };

        loadAuditHistory();
    }, []);

    // ==========================================
    // TIME FORMAT
    // ==========================================

    const formatDate = (timestamp) => {
        if (!timestamp) {
            return "Unknown time";
        }

        return timestamp
            .toDate()
            .toLocaleString();
    };

    // ==========================================
    // SEARCH
    // ==========================================

    const filteredActivities =
        activities.filter((activity) => {

            const search =
                searchTerm
                    .trim()
                    .toLowerCase();

            if (!search) {
                return true;
            }

            return (
                (activity.vehicleNumber || "")
                    .toLowerCase()
                    .includes(search) ||

                (activity.action || "")
                    .toLowerCase()
                    .includes(search) ||

                (activity.reportType || "")
                    .toLowerCase()
                    .includes(search) ||

                (activity.reason || "")
                    .toLowerCase()
                    .includes(search)
            );
        });

    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {
        return <LoadingSpinner />;
    }

    // ==========================================
    // PAGE
    // ==========================================

    return (
        <AdminLayout>

            <div className="space-y-8">

                {/* HEADER */}

                <div>

                    <h1 className="text-3xl font-bold">
                        📜 Admin Audit History
                    </h1>

                    <p className="text-gray-500 mt-2">
                        Complete history of administrative
                        actions in SawariSathi.
                    </p>

                </div>


                {/* AUDIT LIST */}

                <div className="bg-white rounded-2xl shadow-md p-6">

                    {/* SEARCH */}

                    <div className="mb-6">

                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) =>
                                setSearchTerm(e.target.value)
                            }
                            placeholder="🔍 Search vehicle, action, report type..."
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                        />

                    </div>

                    {filteredActivities.length === 0 ? (

                        <p className="text-gray-500">
                            No audit activity found.
                        </p>

                    ) : (

                        <div className="space-y-4">

                            {filteredActivities.map(
                                (activity) => (

                                    <div
                                        key={activity.id}
                                        className="border rounded-xl p-5"
                                    >

                                        {/* ACTION */}

                                        <div className="flex justify-between items-start gap-4">

                                            <div>

                                                <h2 className="font-bold text-lg">
                                                    {activity.action ||
                                                        "Unknown Action"}
                                                </h2>

                                                <p className="text-sm text-gray-500 mt-1">
                                                    {activity.entityType ||
                                                        "Unknown Type"}
                                                </p>

                                            </div>

                                            <span className="text-sm text-gray-500 whitespace-nowrap">
                                                {formatDate(
                                                    activity.createdAt
                                                )}
                                            </span>

                                        </div>


                                        {/* VEHICLE */}

                                        {activity.vehicleNumber && (

                                            <p className="mt-4">

                                                <strong>
                                                    Vehicle:
                                                </strong>{" "}

                                                {activity.vehicleNumber}

                                            </p>

                                        )}


                                        {/* REPORT TYPE */}

                                        {activity.reportType && (

                                            <p className="mt-2">

                                                <strong>
                                                    Report Type:
                                                </strong>{" "}

                                                {activity.reportType}

                                            </p>

                                        )}


                                        {/* REASON */}

                                        {activity.reason && (

                                            <p className="mt-2 text-red-600">

                                                <strong>
                                                    Reason:
                                                </strong>{" "}

                                                {activity.reason}

                                            </p>

                                        )}

                                    </div>

                                )
                            )}

                        </div>

                    )}

                </div>

            </div>

        </AdminLayout>
    );
}

export default AdminAuditHistory;