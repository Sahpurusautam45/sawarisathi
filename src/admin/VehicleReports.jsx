import { useEffect, useState } from "react";

import {
    collection,
    getDocs,
    orderBy,
    query,
} from "firebase/firestore";

import { db } from "../firebase/firebase";
import AdminLayout from "../components/admin/AdminLayout";
import LoadingSpinner from "../components/LoadingSpinner";

function VehicleReports() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    // ==========================================
    // LOAD VEHICLE REPORTS
    // ==========================================

    useEffect(() => {
        const loadReports = async () => {
            try {
                const reportsRef = collection(
                    db,
                    "vehicleReports"
                );

                const reportsQuery = query(
                    reportsRef,
                    orderBy("createdAt", "desc")
                );

                const snapshot = await getDocs(
                    reportsQuery
                );

                const reportList = snapshot.docs.map(
                    (reportDoc) => ({
                        id: reportDoc.id,
                        ...reportDoc.data(),
                    })
                );

                setReports(reportList);

            } catch (error) {
                console.error(
                    "Vehicle Reports Error:",
                    error
                );
            } finally {
                setLoading(false);
            }
        };

        loadReports();
    }, []);

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
                        🚨 Vehicle Reports
                    </h1>

                    <p className="text-gray-500 mt-2">
                        Review vehicle reports submitted by users.
                    </p>
                </div>


                {/* NO REPORTS */}

                {reports.length === 0 ? (

                    <div className="bg-white rounded-2xl shadow p-10 text-center">

                        <div className="text-5xl">
                            ✅
                        </div>

                        <h2 className="text-xl font-bold mt-4">
                            No Vehicle Reports
                        </h2>

                        <p className="text-gray-500 mt-2">
                            There are currently no reports to review.
                        </p>

                    </div>

                ) : (

                    /* REPORT LIST */

                    <div className="space-y-5">

                        {reports.map((report) => (

                            <div
                                key={report.id}
                                className="bg-white rounded-2xl shadow-md p-6 border"
                            >

                                {/* TOP */}

                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                                    <div>

                                        <h2 className="text-xl font-bold">
                                            🚗{" "}
                                            {report.vehicleNumber ||
                                                "Unknown Vehicle"}
                                        </h2>

                                        <p className="text-gray-500 mt-1">
                                            Report ID: {report.id}
                                        </p>

                                    </div>


                                    {/* STATUS */}

                                    <span
                                        className={`inline-flex w-fit px-4 py-2 rounded-full text-sm font-semibold ${report.status === "Pending"
                                                ? "bg-yellow-100 text-yellow-700"
                                                : report.status === "Approved"
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-red-100 text-red-700"
                                            }`}
                                    >
                                        {report.status || "Pending"}
                                    </span>

                                </div>


                                {/* REPORT INFORMATION */}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">

                                    <div className="border rounded-xl p-4">

                                        <p className="text-sm text-gray-500">
                                            Reason
                                        </p>

                                        <p className="font-semibold mt-1">
                                            {report.reportType || "—"}
                                        </p>

                                    </div>


                                    <div className="border rounded-xl p-4">

                                        <p className="text-sm text-gray-500">
                                            Submitted By
                                        </p>

                                        <p className="font-semibold mt-1 break-all">
                                            {report.userId || "—"}
                                        </p>

                                    </div>

                                </div>


                                {/* DESCRIPTION */}

                                <div className="mt-5 border rounded-xl p-4">

                                    <p className="text-sm text-gray-500">
                                        Report Details
                                    </p>

                                    <p className="mt-2 text-gray-800 whitespace-pre-wrap">
                                        {report.description ||
                                            "No details provided."}
                                    </p>

                                </div>


                                {/* ACTION */}

                                <div className="mt-6">

                                    <button
                                        onClick={() =>
                                            window.location.href =
                                            `/admin/vehicle-reports/${report.id}`
                                        }
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold"
                                    >
                                        Review Report →
                                    </button>

                                </div>

                            </div>

                        ))}

                    </div>

                )}

            </div>

        </AdminLayout>
    );
}

export default VehicleReports;