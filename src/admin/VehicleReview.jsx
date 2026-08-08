import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/firebase";
import AdminLayout from "../components/admin/AdminLayout";
import LoadingSpinner from "../components/LoadingSpinner";

function VehicleReview() {
  const { vehicleId } = useParams();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState(null);

  const [loading, setLoading] = useState(true);

  const [bluebookLoading, setBluebookLoading] = useState(true);
  const [bluebook, setBluebook] = useState(null);

  const [insuranceLoading, setInsuranceLoading] = useState(true);
  const [insurance, setInsurance] = useState(null);

  const [taxLoading, setTaxLoading] = useState(true);
  const [tax, setTax] = useState(null);

  const [actionLoading, setActionLoading] = useState(false);


  // ==========================================
  // LOAD VEHICLE + BLUEBOOK + INSURANCE + TAX
  // ==========================================

  useEffect(() => {
    const loadVehicle = async () => {
      try {

        // ======================================
        // VEHICLE
        // vehicles/{vehicleId}
        // ======================================

        const vehicleRef = doc(
          db,
          "vehicles",
          vehicleId
        );

        const vehicleSnap = await getDoc(
          vehicleRef
        );

        if (vehicleSnap.exists()) {
          setVehicle({
            id: vehicleSnap.id,
            ...vehicleSnap.data(),
          });
        } else {
          setVehicle(null);
          return;
        }


        // ======================================
        // BLUEBOOK
        // vehicles/{vehicleId}/bluebook/details
        // ======================================

        const bluebookRef = doc(
          db,
          "vehicles",
          vehicleId,
          "bluebook",
          "details"
        );

        const bluebookSnap = await getDoc(
          bluebookRef
        );

        if (bluebookSnap.exists()) {
          setBluebook(
            bluebookSnap.data()
          );
        } else {
          setBluebook(null);
        }


        // ======================================
        // INSURANCE
        // vehicles/{vehicleId}/insurance/details
        // ======================================

        const insuranceRef = doc(
          db,
          "vehicles",
          vehicleId,
          "insurance",
          "details"
        );

        const insuranceSnap = await getDoc(
          insuranceRef
        );

        if (insuranceSnap.exists()) {
          setInsurance(
            insuranceSnap.data()
          );
        } else {
          setInsurance(null);
        }


        // ======================================
        // TAX
        // vehicles/{vehicleId}/tax/details
        // ======================================

        const taxRef = doc(
          db,
          "vehicles",
          vehicleId,
          "tax",
          "details"
        );

        const taxSnap = await getDoc(
          taxRef
        );

        if (taxSnap.exists()) {
          setTax(
            taxSnap.data()
          );
        } else {
          setTax(null);
        }

      } catch (error) {

        console.error(
          "Vehicle Review Error:",
          error
        );

        setVehicle(null);
        setBluebook(null);
        setInsurance(null);
        setTax(null);

      } finally {

        setLoading(false);
        setBluebookLoading(false);
        setInsuranceLoading(false);
        setTaxLoading(false);

      }
    };

    loadVehicle();

  }, [vehicleId]);


  // ==========================================
  // APPROVE / REJECT VEHICLE
  // ==========================================

  const updateVehicleStatus = async (
    status
  ) => {

    if (!vehicle) return;

    const confirmed = window.confirm(
      `Are you sure you want to ${status.toLowerCase()} this vehicle?`
    );

    if (!confirmed) return;

    try {

      setActionLoading(true);

      const vehicleRef = doc(
        db,
        "vehicles",
        vehicleId
      );

      await updateDoc(
        vehicleRef,
        {
          status,

          verifiedAt:
            status === "Verified"
              ? serverTimestamp()
              : null,
        }
      );

      alert(
        status === "Verified"
          ? "Vehicle verified successfully!"
          : "Vehicle rejected."
      );

      navigate(
        "/admin/vehicle-verification"
      );

    } catch (error) {

      console.error(
        "Status update error:",
        error
      );

      alert(
        "Failed to update vehicle status."
      );

    } finally {

      setActionLoading(false);

    }
  };


  // ==========================================
  // MAIN LOADING
  // ==========================================

  if (loading) {
    return <LoadingSpinner />;
  }


  // ==========================================
  // VEHICLE NOT FOUND
  // ==========================================

  if (!vehicle) {

    return (
      <AdminLayout>

        <div className="bg-white rounded-2xl p-8 text-center">

          <div className="text-6xl">
            🚗
          </div>

          <h2 className="text-2xl font-bold mt-4">
            Vehicle Not Found
          </h2>

          <p className="text-gray-500 mt-2">
            This vehicle may have been removed
            or is unavailable.
          </p>

          <button
            onClick={() =>
              navigate(
                "/admin/vehicle-verification"
              )
            }
            className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl"
          >
            Back to Verification
          </button>

        </div>

      </AdminLayout>
    );

  }


  return (
    <AdminLayout>

      <div>

        {/* =====================================
            HEADER
        ===================================== */}

        <div className="mb-8">

          <button
            onClick={() =>
              navigate(
                "/admin/vehicle-verification"
              )
            }
            className="text-blue-600 hover:underline mb-4"
          >
            ← Back to Vehicle Verification
          </button>

          <h1 className="text-3xl font-bold">
            🔍 Vehicle Review
          </h1>

          <p className="text-gray-500 mt-2">
            Review the submitted vehicle
            information before approving it.
          </p>

        </div>


        {/* =====================================
            VEHICLE INFORMATION
        ===================================== */}

        <div className="bg-white rounded-2xl shadow-md p-8">

          <div className="flex justify-between items-start">

            <div>

              <h2 className="text-2xl font-bold">
                🚗 {vehicle.brand} {vehicle.model}
              </h2>

              <p className="text-gray-500 mt-2">
                {vehicle.vehicleNumber}
              </p>

            </div>

            <span className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full">
              {vehicle.status || "Pending"}
            </span>

          </div>


          {/* =====================================
              VEHICLE DETAILS
          ===================================== */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">

            <div className="border rounded-xl p-5">

              <p className="text-gray-500 text-sm">
                Vehicle Number
              </p>

              <p className="font-semibold mt-1">
                {vehicle.vehicleNumber || "—"}
              </p>

            </div>


            <div className="border rounded-xl p-5">

              <p className="text-gray-500 text-sm">
                Vehicle Type
              </p>

              <p className="font-semibold mt-1">
                {vehicle.vehicleType || "—"}
              </p>

            </div>


            <div className="border rounded-xl p-5">

              <p className="text-gray-500 text-sm">
                Brand
              </p>

              <p className="font-semibold mt-1">
                {vehicle.brand || "—"}
              </p>

            </div>


            <div className="border rounded-xl p-5">

              <p className="text-gray-500 text-sm">
                Model
              </p>

              <p className="font-semibold mt-1">
                {vehicle.model || "—"}
              </p>

            </div>


            <div className="border rounded-xl p-5">

              <p className="text-gray-500 text-sm">
                Color
              </p>

              <p className="font-semibold mt-1">
                {vehicle.color || "—"}
              </p>

            </div>


            <div className="border rounded-xl p-5">

              <p className="text-gray-500 text-sm">
                Remarks
              </p>

              <p className="font-semibold mt-1">
                {vehicle.remarks || "No remarks"}
              </p>

            </div>

          </div>


          {/* =====================================
              VERIFICATION CHECKLIST
          ===================================== */}

          <div className="mt-10">

            <h2 className="text-2xl font-bold">
              📋 Verification Checklist
            </h2>

            <p className="text-gray-500 mt-2">
              Review the submitted records before
              making the final verification decision.
            </p>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">


              {/* =================================
                  BLUEBOOK
              ================================= */}

              <div className="border rounded-xl p-5">

                <div className="flex justify-between items-center">

                  <h3 className="font-bold text-lg">
                    📘 Bluebook
                  </h3>

                  {bluebookLoading ? (

                    <span className="text-gray-500 text-sm">
                      Loading...
                    </span>

                  ) : bluebook ? (

                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                      Submitted
                    </span>

                  ) : (

                    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">
                      Not Added
                    </span>

                  )}

                </div>


                {bluebookLoading ? (

                  <p className="text-gray-500 mt-4">
                    Loading Bluebook information...
                  </p>

                ) : bluebook ? (

                  <div className="mt-5 space-y-3">

                    <p>
                      <strong>
                        Bluebook Number:
                      </strong>{" "}
                      {bluebook.bluebookNumber || "—"}
                    </p>

                    <p>
                      <strong>
                        Registration Date:
                      </strong>{" "}
                      {bluebook.registrationDate || "—"}
                    </p>

                    <p>
                      <strong>
                        Expiry Date:
                      </strong>{" "}
                      {bluebook.expiryDate || "—"}
                    </p>

                    <p>
                      <strong>
                        Status:
                      </strong>{" "}
                      {bluebook.status ||
                        "Pending Verification"}
                    </p>

                  </div>

                ) : (

                  <p className="text-red-600 mt-4">
                    No Bluebook information submitted.
                  </p>

                )}

              </div>


              {/* =================================
                  INSURANCE
              ================================= */}

              <div className="border rounded-xl p-5">

                <div className="flex justify-between items-center">

                  <h3 className="font-bold text-lg">
                    🛡 Insurance
                  </h3>

                  {insuranceLoading ? (

                    <span className="text-gray-500 text-sm">
                      Loading...
                    </span>

                  ) : insurance ? (

                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                      Submitted
                    </span>

                  ) : (

                    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">
                      Not Added
                    </span>

                  )}

                </div>


                {insuranceLoading ? (

                  <p className="text-gray-500 mt-4">
                    Loading Insurance information...
                  </p>

                ) : insurance ? (

                  <div className="mt-5 space-y-3">

                    <p>
                      <strong>
                        Category:
                      </strong>{" "}
                      {insurance.category || "—"}
                    </p>

                    <p>
                      <strong>
                        Company:
                      </strong>{" "}
                      {insurance.company || "—"}
                    </p>

                    <p>
                      <strong>
                        Policy Number:
                      </strong>{" "}
                      {insurance.policyNumber || "—"}
                    </p>

                    <p>
                      <strong>
                        Valid Until:
                      </strong>{" "}
                      {insurance.validUntil || "—"}
                    </p>

                    <p>
                      <strong>
                        Status:
                      </strong>{" "}
                      {insurance.status ||
                        "Pending Verification"}
                    </p>

                  </div>

                ) : (

                  <p className="text-red-600 mt-4">
                    No Insurance information submitted.
                  </p>

                )}

              </div>


              {/* =================================
                  VEHICLE TAX
              ================================= */}

              <div className="border rounded-xl p-5">

                <div className="flex justify-between items-center">

                  <h3 className="font-bold text-lg">
                    💰 Vehicle Tax
                  </h3>

                  {taxLoading ? (

                    <span className="text-gray-500 text-sm">
                      Loading...
                    </span>

                  ) : tax ? (

                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                      Submitted
                    </span>

                  ) : (

                    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">
                      Not Added
                    </span>

                  )}

                </div>


                {taxLoading ? (

                  <p className="text-gray-500 mt-4">
                    Loading Tax information...
                  </p>

                ) : tax ? (

                  <div className="mt-5 space-y-3">

                    <p>
                      <strong>
                        Receipt Number:
                      </strong>{" "}
                      {tax.receiptNumber || "—"}
                    </p>

                    <p>
                      <strong>
                        Paid Until:
                      </strong>{" "}
                      {tax.paidUntil || "—"}
                    </p>

                    <p>
                      <strong>
                        Status:
                      </strong>{" "}
                      {tax.status ||
                        "Pending Verification"}
                    </p>

                  </div>

                ) : (

                  <p className="text-red-600 mt-4">
                    No Tax information submitted.
                  </p>

                )}

              </div>


              {/* =================================
                  DOCUMENTS
              ================================= */}

              <div className="border rounded-xl p-5">

                <h3 className="font-bold text-lg">
                  📄 Documents
                </h3>

                <p className="text-gray-500 mt-2">
                  Uploaded documents will appear here
                  once the document system is enabled.
                </p>

                <span className="inline-block mt-4 bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                  Coming Soon
                </span>

              </div>

            </div>

          </div>


          {/* =====================================
              ADMIN DECISION
          ===================================== */}

          <div className="mt-10 border-t pt-8">

            <h2 className="text-xl font-bold">
              Admin Decision
            </h2>

            <p className="text-gray-500 mt-2">
              Approve the vehicle only after the
              submitted information has been checked.
            </p>


            <div className="flex flex-col md:flex-row gap-4 mt-6">

              <button
                onClick={() =>
                  updateVehicleStatus("Verified")
                }
                disabled={actionLoading}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 rounded-xl font-semibold"
              >
                {actionLoading
                  ? "Processing..."
                  : "✓ Approve & Verify"}
              </button>


              <button
                onClick={() =>
                  updateVehicleStatus("Rejected")
                }
                disabled={actionLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-3 rounded-xl font-semibold"
              >
                {actionLoading
                  ? "Processing..."
                  : "✕ Reject Vehicle"}
              </button>

            </div>

          </div>

        </div>

      </div>

    </AdminLayout>
  );
}

export default VehicleReview;