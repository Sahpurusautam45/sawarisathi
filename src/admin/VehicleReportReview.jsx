import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/firebase";
import { createAdminActivity } from "../services/adminActivityService";
import AdminLayout from "../components/admin/AdminLayout";
import LoadingSpinner from "../components/LoadingSpinner";

function VehicleReportReview() {
  const { reportId } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // ==========================================
  // LOAD REPORT
  // ==========================================

  useEffect(() => {
    const loadReport = async () => {
      try {
        const reportRef = doc(
          db,
          "vehicleReports",
          reportId
        );

        const reportSnap = await getDoc(reportRef);

        if (reportSnap.exists()) {
          setReport({
            id: reportSnap.id,
            ...reportSnap.data(),
          });
        } else {
          setReport(null);
        }
      } catch (error) {
        console.error(
          "Vehicle Report Review Error:",
          error
        );

        setReport(null);
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [reportId]);

  // ==========================================
  // REJECT VEHICLE REPORT
  // ==========================================

  const handleRejectReport = async () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to reject this report?"
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);

      const reportRef = doc(
        db,
        "vehicleReports",
        reportId
      );

      await updateDoc(reportRef, {
        status: "Rejected",
        rejectionReason: rejectionReason.trim(),
        rejectedAt: serverTimestamp(),
        reviewedAt: serverTimestamp(),
      });

      await createAdminActivity({
        action: "Report Rejected",
        entityType: "report",
        entityId: reportId,
        vehicleNumber:
          report.vehicleNumber || null,
        reportType:
          report.reportType || null,
        reason:
          rejectionReason.trim(),
      });

      alert("Report rejected successfully.");

      navigate("/admin/vehicle-reports");
    } catch (error) {
      console.error(
        "Reject Report Error:",
        error
      );

      alert("Failed to reject the report.");
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // APPROVE VEHICLE REPORT
  // ==========================================

  const handleApproveReport = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to approve this report?"
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);

      // ==========================================
      // APPROVE REPORT
      // ==========================================

      const reportRef = doc(
        db,
        "vehicleReports",
        reportId
      );

      await updateDoc(reportRef, {
        status: "Approved",
        reviewedAt: serverTimestamp(),
        approvedAt: serverTimestamp(),
        rejectionReason: null,
      });


      // ==========================================
      // VEHICLE STOLEN REPORT
      // ==========================================

      if (
        report.reportType === "Vehicle Stolen"
      ) {

        const publicVehicleRef = doc(
          db,
          "publicVehicles",
          report.vehicleId
        );

        await updateDoc(
          publicVehicleRef,
          {
            stolenStatus: "Reported Stolen",
            stolenReportedAt:
              serverTimestamp(),
            updatedAt:
              serverTimestamp(),
          }
        );
      }


      // ==========================================
      // SUCCESS
      // ==========================================

      await createAdminActivity({
        action: "Report Approved",
        entityType: "report",
        entityId: reportId,
        vehicleNumber:
          report.vehicleNumber || null,
        reportType:
          report.reportType || null,
      });

      alert(
        "Report approved successfully."
      );

      navigate("/admin/vehicle-reports");

    } catch (error) {

      console.error(
        "Approve Report Error:",
        error
      );

      alert(
        "Failed to approve the report."
      );

    } finally {

      setActionLoading(false);

    }
  };
  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return <LoadingSpinner />;
  }

  // ==========================================
  // REPORT NOT FOUND
  // ==========================================

  if (!report) {
    return (
      <AdminLayout>

        <div className="bg-white rounded-2xl shadow-md p-10 text-center">

          <div className="text-6xl">
            🚨
          </div>

          <h2 className="text-2xl font-bold mt-4">
            Report Not Found
          </h2>

          <p className="text-gray-500 mt-2">
            This vehicle report does not exist
            or may have been removed.
          </p>

          <button
            onClick={() =>
              navigate("/admin/vehicle-reports")
            }
            className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold"
          >
            ← Back to Vehicle Reports
          </button>

        </div>

      </AdminLayout>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <AdminLayout>

      <div className="space-y-8">

        {/* BACK BUTTON */}

        <button
          onClick={() =>
            navigate("/admin/vehicle-reports")
          }
          className="text-blue-600 hover:underline font-semibold"
        >
          ← Back to Vehicle Reports
        </button>


        {/* HEADER */}

        <div>

          <h1 className="text-3xl font-bold">
            🚨 Vehicle Report Review
          </h1>

          <p className="text-gray-500 mt-2">
            Carefully review this report before
            making an administrative decision.
          </p>

        </div>


        {/* REPORT CARD */}

        <div className="bg-white rounded-2xl shadow-md border p-8">

          {/* VEHICLE */}

          <div className="border rounded-xl p-5">

            <p className="text-sm text-gray-500">
              Vehicle
            </p>

            <p className="text-2xl font-bold mt-1">
              🚗 {report.vehicleNumber || "Unknown Vehicle"}
            </p>

          </div>


          {/* REASON + STATUS */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">

            <div className="border rounded-xl p-5">

              <p className="text-sm text-gray-500">
                Reason for Report
              </p>

              <p className="font-bold text-lg mt-1">
                {report.reportType || "—"}
              </p>

            </div>


            <div className="border rounded-xl p-5">

              <p className="text-sm text-gray-500">
                Status
              </p>

              <span
                className={`inline-block mt-2 px-4 py-2 rounded-full text-sm font-semibold ${report.status === "Pending"
                  ? "bg-yellow-100 text-yellow-700"
                  : report.status === "Approved"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                  }`}
              >
                {report.status || "Pending"}
              </span>

            </div>

          </div>


          {/* SUBMITTED BY */}

          <div className="border rounded-xl p-5 mt-5">

            <p className="text-sm text-gray-500">
              Submitted By
            </p>

            <p className="font-semibold mt-1 break-all">
              {report.userId || "—"}
            </p>

          </div>


          {/* DETAILS */}

          <div className="border rounded-xl p-5 mt-5">

            <p className="text-sm text-gray-500">
              Report Details
            </p>

            <p className="mt-2 text-gray-800 whitespace-pre-wrap">
              {report.description ||
                "No details provided."}
            </p>

          </div>


          {/* REPORT ID */}

          <div className="border rounded-xl p-5 mt-5">

            <p className="text-sm text-gray-500">
              Report ID
            </p>

            <p className="font-mono text-sm mt-1 break-all">
              {report.id}
            </p>

          </div>


          {/* ==========================================
              ADMIN DECISION
          ========================================== */}

          <div className="border-t mt-8 pt-8">

            <h2 className="text-xl font-bold">
              Admin Decision
            </h2>

            <p className="text-gray-500 mt-2">
              Review all submitted information before
              approving or rejecting this report.
            </p>


            {/* REJECTION REASON */}

            {report.status === "Pending" && (

              <div className="mt-6">

                <label className="block font-semibold mb-2">
                  Rejection Reason
                </label>

                <textarea
                  value={rejectionReason}
                  onChange={(e) =>
                    setRejectionReason(e.target.value)
                  }
                  placeholder="Enter the reason if you reject this report..."
                  rows="4"
                  className="w-full border rounded-xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
                />

                <p className="text-sm text-gray-500 mt-2">
                  A rejection reason is required when
                  rejecting a report.
                </p>

              </div>

            )}


            {/* ACTION BUTTONS */}

            <div className="flex flex-col md:flex-row gap-4 mt-6">

              {/* APPROVE */}

              <button
                onClick={handleApproveReport}
                disabled={
                  report.status !== "Pending" ||
                  actionLoading
                }
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 rounded-xl font-semibold"
              >
                {actionLoading
                  ? "Processing..."
                  : "✓ Approve Report"}
              </button>


              {/* REJECT */}

              <button
                onClick={handleRejectReport}
                disabled={
                  report.status !== "Pending" ||
                  actionLoading
                }
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-3 rounded-xl font-semibold"
              >
                {actionLoading
                  ? "Processing..."
                  : "✕ Reject Report"}
              </button>

            </div>

          </div>

        </div>

      </div>

    </AdminLayout>
  );
}

export default VehicleReportReview;