import { useEffect, useState } from "react";

import {
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "../firebase/firebase";
import { createAdminActivity } from "../services/adminActivityService";

import {
  createUserNotificationForUser,
} from "../services/userNotificationService";

import AdminLayout from "../components/admin/AdminLayout";
import LoadingSpinner from "../components/LoadingSpinner";


function VehicleReview() {

  const { vehicleId } = useParams();

  const navigate = useNavigate();

  const [searchParams] =
    useSearchParams();

  // ==========================================
  // VIEW MODE
  // Users → View Vehicle
  // ==========================================

  const isViewMode =
    searchParams.get("mode") === "view";
  // ==========================================
  // NOTIFICATION DOCUMENT TO REVIEW
  // ==========================================

  const requestedDocument =
    searchParams
      .get("document")
      ?.toLowerCase() || "";


  // ==========================================
  // VEHICLE
  // ==========================================

  const [vehicle, setVehicle] =
    useState(null);

  const [loading, setLoading] =
    useState(true);


  // ==========================================
  // BLUEBOOK
  // ==========================================

  const [bluebookLoading, setBluebookLoading] =
    useState(true);

  const [bluebook, setBluebook] =
    useState(null);


  // ==========================================
  // INSURANCE
  // ==========================================

  const [insuranceLoading, setInsuranceLoading] =
    useState(true);

  const [insurance, setInsurance] =
    useState(null);


  // ==========================================
  // TAX
  // ==========================================

  const [taxLoading, setTaxLoading] =
    useState(true);

  const [tax, setTax] =
    useState(null);


  // ==========================================
  // ACTION LOADING
  // ==========================================

  const [actionLoading, setActionLoading] =
    useState(false);

  const [rejectionModal, setRejectionModal] =
    useState({
      open: false,
      section: "",
    });

  const [sectionRejectionReason, setSectionRejectionReason] =
    useState("");


  // ==========================================
  // SECTION STATUS
  // ==========================================

  const [sectionStatus, setSectionStatus] =
    useState({
      vehicle: "Pending",
      bluebook: "Pending",
      insurance: "Pending",
      tax: "Pending",
    });


  // ==========================================
  // OVERALL REJECTION REASON
  // ==========================================

  const [rejectionReason, setRejectionReason] =
    useState("");


  // ==========================================
  // STATUS STYLE
  // ==========================================

  const getStatusStyle = (status) => {

    if (status === "Verified") {
      return "bg-green-100 text-green-700";
    }

    if (status === "Rejected") {
      return "bg-red-100 text-red-700";
    }

    return "bg-yellow-100 text-yellow-700";
  };


  // ==========================================
  // MASK OWNER NAME
  // ==========================================

  const maskOwnerName = (fullName = "") => {

    const safeName =
      typeof fullName === "string"
        ? fullName
        : String(fullName ?? "");

    if (!safeName.trim()) {
      return "";
    }

    const maskWord = (word) => {

      if (!word) {
        return "";
      }

      const length =
        word.length;


      if (length === 1) {
        return "*";
      }


      if (length === 2) {
        return `${word[0]}*`;
      }


      if (length === 3) {
        return `${word[0]}*${word.slice(-1)}`;
      }


      if (length === 4) {
        return `${word[0]}*${word.slice(-2)}`;
      }


      const visibleEachSide =
        length <= 6
          ? 2
          : length <= 9
            ? 2
            : 3;


      const firstPart =
        word.slice(
          0,
          visibleEachSide
        );


      const lastPart =
        word.slice(
          -visibleEachSide
        );


      const maskedLength =
        length -
        visibleEachSide * 2;


      return (
        firstPart +
        "*".repeat(
          Math.max(
            1,
            maskedLength
          )
        ) +
        lastPart
      );
    };


    return safeName
      .trim()
      .split(/\s+/)
      .map(maskWord)
      .join(" ");
  };


  // ==========================================
  // LOAD VEHICLE + DOCUMENTS
  // ==========================================

  useEffect(() => {


    const loadVehicle = async () => {

      try {

        // ======================================
        // VEHICLE
        // ======================================

        const vehicleRef =
          doc(
            db,
            "vehicles",
            vehicleId
          );


        const vehicleSnap =
          await getDoc(
            vehicleRef
          );


        if (!vehicleSnap.exists()) {

          setVehicle(null);

          return;
        }


        const vehicleData = {
          id: vehicleSnap.id,
          ...vehicleSnap.data(),
        };


        setVehicle(
          vehicleData
        );


        // ======================================
        // LOAD EXISTING SECTION STATUS
        // ======================================

        setSectionStatus({

          vehicle:
            vehicleData.status ||
            "Pending",

          bluebook:
            vehicleData.bluebookStatus ||
            "Pending",

          insurance:
            vehicleData.insuranceStatus ||
            "Pending",

          tax:
            vehicleData.taxStatus ||
            "Pending",
        });


        // ======================================
        // LOAD OVERALL REJECTION REASON
        // ======================================

        setRejectionReason(
          vehicleData.rejectionReason ||
          ""
        );


        // ======================================
        // BLUEBOOK
        // ======================================

        const bluebookRef =
          doc(
            db,
            "vehicles",
            vehicleId,
            "bluebook",
            "details"
          );


        const bluebookSnap =
          await getDoc(
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
        // ======================================

        const insuranceRef =
          doc(
            db,
            "vehicles",
            vehicleId,
            "insurance",
            "details"
          );


        const insuranceSnap =
          await getDoc(
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
        // ======================================

        const taxRef =
          doc(
            db,
            "vehicles",
            vehicleId,
            "tax",
            "details"
          );


        const taxSnap =
          await getDoc(
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
  // FOCUS REQUESTED DOCUMENT
  // ==========================================

  useEffect(() => {

    if (!requestedDocument || loading) {
      return;
    }

    const timer = setTimeout(() => {

      const section = document.getElementById(
        requestedDocument
      );

      if (section) {

        section.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        section.classList.add(
          "ring-4",
          "ring-blue-400",
          "rounded-xl"
        );

        setTimeout(() => {

          section.classList.remove(
            "ring-4",
            "ring-blue-400",
            "rounded-xl"
          );

        }, 3000);
      }

    }, 500);

    return () => clearTimeout(timer);

  }, [requestedDocument, loading]);


  // ==========================================
  // UPDATE INDIVIDUAL SECTION STATUS
  // ==========================================

  // ==========================================
  // REMOVE COMPLETED DOCUMENT NOTIFICATION
  // ==========================================

  const removeDocumentNotification = async (
    documentType
  ) => {

    if (!vehicleId || !documentType) {
      return;
    }

    try {

      const notificationsRef =
        collection(
          db,
          "adminNotifications"
        );

      const notificationQuery =
        query(
          notificationsRef,
          where(
            "vehicleId",
            "==",
            vehicleId
          ),
          where(
            "documentType",
            "==",
            documentType
          )
        );

      const snapshot =
        await getDocs(
          notificationQuery
        );

      // Delete matching notifications
      await Promise.all(
        snapshot.docs.map(
          (notificationDoc) =>
            deleteDoc(
              notificationDoc.ref
            )
        )
      );

      console.log(
        `✅ ${documentType} notification removed.`
      );

    } catch (error) {

      console.error(
        "Notification cleanup error:",
        error
      );

    }
  };

  const updateSectionStatus = async (
    section,
    status
  ) => {

    if (!vehicle) {
      return;
    }

    // ==========================================
    // REJECTION REASON
    // ==========================================

    let reason = "";

    if (status === "Rejected") {

      reason = window.prompt(
        `Enter the reason for rejecting ${section}:`
      );

      if (reason === null) {
        return;
      }

      reason = reason.trim();

      if (!reason) {
        alert(
          "Please provide a rejection reason."
        );
        return;
      }
    }

    // ==========================================
    // CONFIRM ACTION
    // ==========================================

    const confirmed = window.confirm(
      `Are you sure you want to ${status.toLowerCase()} ${section}?`
    );

    if (!confirmed) {
      return;
    }

    try {

      setActionLoading(true);

      const vehicleRef = doc(
        db,
        "vehicles",
        vehicleId
      );

      // ========================================
      // DATA TO SAVE
      // ========================================

      const updateData = {
        [`${section}Status`]: status,

        [`${section}RejectionReason`]:
          status === "Rejected"
            ? reason
            : null,

        ...(status === "Verified" &&
          vehicle[`${section}RenewalPending`] === true
          ? {
            [`${section}RenewalPending`]: false,
          }
          : {}),

        ...(status === "Verified" &&
          vehicle[`${section}Resubmitted`] === true
          ? {
            [`${section}Resubmitted`]: false,
          }
          : {}),

        updatedAt: serverTimestamp(),
      };

      // ========================================
      // CHECK DOCUMENT RENEWAL
      // ========================================

      const isRenewalApproval =
        status === "Verified" &&
        vehicle[`${section}RenewalPending`] === true;

      const isResubmissionApproval =
        status === "Verified" &&
        vehicle[`${section}Resubmitted`] === true;

      // ========================================
      // SAVE TO FIREBASE
      // ========================================

      await updateDoc(
        vehicleRef,
        updateData
      );

      if (isRenewalApproval) {
        try {
          const documentNames = {
            tax: "Tax",
            insurance: "Insurance",
            bluebook: "Bluebook",
          };

          if (isResubmissionApproval) {
            try {
              const documentNames = {
                tax: "Tax",
                insurance: "Insurance",
                bluebook: "Bluebook",
              };

              const documentName =
                documentNames[section] || section;

              await createUserNotificationForUser({
                userId: vehicle.ownerId,

                title:
                  `${documentName} Resubmission Approved`,

                message:
                  `Your corrected ${documentName.toLowerCase()} has been approved by Admin.`,

                type: "document_resubmission_approved",

                vehicleId,

                documentType: section,
              });

              console.log(
                `✅ ${documentName} resubmission approval notification sent to user.`
              );

            } catch (notificationError) {
              console.error(
                "❌ Failed to create user resubmission approval notification:",
                notificationError
              );
            }
          }

          const documentName =
            documentNames[section] || section;

          await createUserNotificationForUser({
            userId: vehicle.ownerId,

            title:
              `${documentName} Renewal Approved`,

            message:
              `Your ${documentName.toLowerCase()} renewal for ${vehicle.vehicleNumber || "your vehicle"
              } has been approved by Admin.`,

            type: "document_renewal_approved",

            vehicleId,

            documentType: section,
          });

          console.log(
            `✅ ${documentName} renewal approval notification sent to user.`
          );

        } catch (notificationError) {

          console.error(
            "❌ Failed to create user renewal notification:",
            notificationError
          );
        }
      }

      if (isResubmissionApproval) {
        try {
          const documentNames = {
            tax: "Tax",
            insurance: "Insurance",
            bluebook: "Bluebook",
          };

          const documentName =
            documentNames[section] || section;

          await createUserNotificationForUser({
            userId: vehicle.ownerId,

            title:
              `${documentName} Resubmission Approved`,

            message:
              `Your corrected ${documentName.toLowerCase()} has been approved by Admin.`,

            type: "document_resubmission_approved",

            vehicleId,

            documentType: section,
          });

          console.log(
            `✅ ${documentName} resubmission approval notification sent to user.`
          );

        } catch (notificationError) {
          console.error(
            "❌ Failed to create user resubmission approval notification:",
            notificationError
          );
        }
      }
      // ========================================
      // COMPLETE ADMIN NOTIFICATION
      // ========================================

      if (
        status === "Verified" ||
        status === "Rejected"
      ) {

        const notificationDocumentType =
          section === "bluebook"
            ? "Bluebook"
            : section === "insurance"
              ? "Insurance"
              : section === "tax"
                ? "Tax"
                : null;

        if (notificationDocumentType) {

          await removeDocumentNotification(
            notificationDocumentType
          );

        }

      }

      // ========================================
      // UPDATE SCREEN IMMEDIATELY
      // ========================================

      setSectionStatus(
        (previous) => ({
          ...previous,
          [section]: status,
        })
      );

      setVehicle(
        (previous) => ({
          ...previous,
          [`${section}Status`]: status,
          [`${section}RejectionReason`]:
            status === "Rejected"
              ? reason
              : null,
        })
      );

      alert(
        `${section.charAt(0).toUpperCase() + section.slice(1)} marked as ${status}.`
      );

    } catch (error) {

      console.error(
        "Section status update error:",
        error
      );

      alert(
        "Failed to update section status."
      );

    } finally {

      setActionLoading(false);
    }
  };


  // ==========================================
  // CREATE PUBLIC VEHICLE
  // ==========================================

  const createPublicVehicle = async () => {

    if (!vehicle) {

      throw new Error(
        "Vehicle information not available."
      );
    }


    const publicVehicleRef =
      doc(
        db,
        "publicVehicles",
        vehicleId
      );


    const publicVehicleData = {

      // ======================================
      // BASIC VEHICLE INFORMATION
      // ======================================

      vehicleNumber:
        vehicle.vehicleNumber ||
        "",

      vehicleType:
        vehicle.vehicleType ||
        "",

      brand:
        vehicle.brand ||
        "",

      model:
        vehicle.model ||
        "",

      color:
        vehicle.color ||
        "",


      // ======================================
      // PUBLIC OWNER INFORMATION
      // ======================================

      ownerNameMasked:
        maskOwnerName(
          vehicle.ownerName
        ),


      // ======================================
      // VERIFICATION
      // ======================================

      status:
        "Verified",

      verificationBadge:
        true,


      // ======================================
      // SECURITY
      // ======================================

      stolenStatus:
        "Not Reported",


      // ======================================
      // BLUEBOOK
      // ======================================

      registrationDate:
        bluebook?.registrationDate ||
        null,

      bluebookExpiry:
        bluebook?.expiryDate ||
        null,


      engineCapacity:
        bluebook?.engineCapacity ||
        null,

      cylinders:
        bluebook?.cylinders ||
        null,

      seatingCapacity:
        bluebook?.["Seating Capacity"] ||
        null,

      fuelType:
        bluebook?.["Fuel Type"] ||
        null,


      // ======================================
      // INSURANCE
      // ======================================

      insuranceStatus:
        sectionStatus.insurance,

      insuranceExpiry:
        insurance?.validUntil ||
        null,


      // ======================================
      // TAX
      // ======================================

      taxStatus:
        sectionStatus.tax,

      taxExpiry:
        tax?.paidUntil ||
        null,


      // ======================================
      // TIMESTAMPS
      // ======================================

      verifiedAt:
        serverTimestamp(),

      updatedAt:
        serverTimestamp(),

      createdFrom:
        "SawariSathi Admin Verification",
    };


    await setDoc(
      publicVehicleRef,
      publicVehicleData
    );
  };


  // ==========================================
  // REMOVE PUBLIC VEHICLE
  // ==========================================

  const removePublicVehicle = async () => {

    const publicVehicleRef =
      doc(
        db,
        "publicVehicles",
        vehicleId
      );


    await deleteDoc(
      publicVehicleRef
    );
  };


  // ==========================================
  // FINAL VEHICLE APPROVE / REJECT
  // ==========================================

  const updateVehicleStatus = async (
    status
  ) => {

    if (!vehicle) {
      return;
    }


    // ======================================
    // REJECTION REASON
    // ======================================

    if (
      status === "Rejected" &&
      !rejectionReason.trim()
    ) {

      alert(
        "Please provide a rejection reason."
      );

      return;
    }


    // ======================================
    // CONFIRMATION
    // ======================================

    const confirmed =
      window.confirm(
        `Are you sure you want to ${status.toLowerCase()} this vehicle?`
      );


    if (!confirmed) {
      return;
    }


    try {

      setActionLoading(true);


      // ======================================
      // UPDATE PRIVATE VEHICLE
      // ======================================

      const vehicleRef =
        doc(
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

          rejectionReason:
            status === "Rejected"
              ? rejectionReason.trim()
              : null,

          updatedAt:
            serverTimestamp(),
        }
      );


      // ======================================
      // CREATE ADMIN ACTIVITY
      // ======================================

      await createAdminActivity({

        action:
          status === "Verified"
            ? "Vehicle Verified"
            : "Vehicle Rejected",

        entityType:
          "vehicle",

        entityId:
          vehicleId,

        vehicleNumber:
          vehicle.vehicleNumber ||
          null,

        reason:
          status === "Rejected"
            ? rejectionReason.trim()
            : null,
      });


      // ======================================
      // VERIFIED
      // ======================================

      if (
        status === "Verified"
      ) {

        await createPublicVehicle();


        alert(
          "Vehicle verified successfully and added to public search!"
        );
      }


      // ======================================
      // REJECTED
      // ======================================

      if (
        status === "Rejected"
      ) {

        try {

          await removePublicVehicle();

        } catch (publicError) {

          console.warn(
            "Public vehicle record could not be removed:",
            publicError
          );
        }


        alert(
          "Vehicle rejected."
        );
      }


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
  // LOADING
  // ==========================================

  if (loading) {

    return (
      <LoadingSpinner />
    );
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


  // ==========================================
  // MAIN PAGE
  // ==========================================

  return (

    <AdminLayout>

      <div className="max-w-7xl mx-auto">


        {/* =====================================
            HEADER
        ===================================== */}

        <div className="mb-8">

          <button
            onClick={() => {

              if (isViewMode) {

                navigate(-1);

              } else {

                navigate(
                  "/admin/vehicle-verification"
                );

              }

            }}
            className="text-blue-600 hover:underline mb-4"
          >

            {isViewMode
              ? "← Back to User Vehicles"
              : "← Back to Vehicle Verification"}

          </button>


          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <div>

              <h1 className="text-3xl font-bold">

                {isViewMode
                  ? "👁 Vehicle Details"
                  : "🔍 Vehicle Review"}

              </h1>


              <p className="text-gray-500 mt-2">

                {isViewMode
                  ? "View vehicle information and verification status."
                  : "Review the submitted vehicle information before making a verification decision."}

              </p>

            </div>


            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusStyle(
                vehicle.status
              )}`}
            >
              {vehicle.status ||
                "Pending"}
            </span>

          </div>

        </div>


        {/* =====================================
            VEHICLE HEADER CARD
        ===================================== */}

        <div className="bg-white rounded-2xl shadow-md p-6">


          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <div>

              <h2 className="text-2xl font-bold text-gray-800">

                🚗{" "}

                {vehicle.brand ||
                  "Unknown Brand"}

                {" "}

                {vehicle.model ||
                  ""}

              </h2>


              <p className="text-gray-500 mt-2">

                {vehicle.vehicleNumber ||
                  "No vehicle number"}

              </p>

            </div>


            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusStyle(
                vehicle.status
              )}`}
            >
              {vehicle.status ||
                "Pending"}
            </span>

          </div>


          {/* =====================================
              OWNER INFORMATION
          ===================================== */}

          <div className="mt-8">

            <h3 className="text-xl font-bold mb-4">
              👤 Owner Information
            </h3>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">


              <div className="border rounded-xl p-5">

                <p className="text-gray-500 text-sm">
                  Owner Name
                </p>

                <p className="font-semibold mt-1">
                  {vehicle.ownerName ||
                    "Not Available"}
                </p>

              </div>


              <div className="border rounded-xl p-5">

                <p className="text-gray-500 text-sm">
                  Owner Email
                </p>

                <p className="font-semibold mt-1 break-all">
                  {vehicle.ownerEmail ||
                    "Not Available"}
                </p>

              </div>


              <div className="border rounded-xl p-5">

                <p className="text-gray-500 text-sm">
                  Owner ID
                </p>

                <p className="font-mono text-sm mt-1 break-all">
                  {vehicle.ownerId ||
                    "Not Available"}
                </p>

              </div>


              <div className="border rounded-xl p-5">

                <p className="text-gray-500 text-sm">
                  Vehicle ID
                </p>

                <p className="font-mono text-sm mt-1 break-all">
                  {vehicle.id}
                </p>

              </div>

            </div>

          </div>


          {/* =====================================
              VEHICLE INFORMATION
          ===================================== */}

          <div
            id="vehicle"
            className="mt-10"
          >

            <h3 className="text-xl font-bold mb-4">
              🚘 Vehicle Information
            </h3>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">


              <div className="border rounded-xl p-5">

                <p className="text-gray-500 text-sm">
                  Vehicle Number
                </p>

                <p className="font-semibold mt-1">
                  {vehicle.vehicleNumber ||
                    "—"}
                </p>

              </div>


              <div className="border rounded-xl p-5">

                <p className="text-gray-500 text-sm">
                  Vehicle Type
                </p>

                <p className="font-semibold mt-1">
                  {vehicle.vehicleType ||
                    "—"}
                </p>

              </div>


              <div className="border rounded-xl p-5">

                <p className="text-gray-500 text-sm">
                  Brand
                </p>

                <p className="font-semibold mt-1">
                  {vehicle.brand ||
                    "—"}
                </p>

              </div>


              <div className="border rounded-xl p-5">

                <p className="text-gray-500 text-sm">
                  Model
                </p>

                <p className="font-semibold mt-1">
                  {vehicle.model ||
                    "—"}
                </p>

              </div>


              <div className="border rounded-xl p-5">

                <p className="text-gray-500 text-sm">
                  Color
                </p>

                <p className="font-semibold mt-1">
                  {vehicle.color ||
                    "—"}
                </p>

              </div>


              <div className="border rounded-xl p-5">

                <p className="text-gray-500 text-sm">
                  Remarks
                </p>

                <p className="font-semibold mt-1">
                  {vehicle.remarks ||
                    "No remarks"}
                </p>

              </div>


              <div className="border rounded-xl p-5">

                <p className="text-gray-500 text-sm">
                  Engine Capacity
                </p>

                <p className="font-semibold mt-1">
                  {vehicle.engineCapacity
                    ? `${vehicle.engineCapacity} cc`
                    : "—"}
                </p>

              </div>


              <div className="border rounded-xl p-5">

                <p className="text-gray-500 text-sm">
                  Cylinders
                </p>

                <p className="font-semibold mt-1">
                  {vehicle.cylinders ||
                    "—"}
                </p>

              </div>


              <div className="border rounded-xl p-5">

                <p className="text-gray-500 text-sm">
                  Seating Capacity
                </p>

                <p className="font-semibold mt-1">
                  {vehicle.seatingCapacity ||
                    "—"}
                </p>

              </div>


              <div className="border rounded-xl p-5">

                <p className="text-gray-500 text-sm">
                  Fuel Type
                </p>

                <p className="font-semibold mt-1">
                  {vehicle.fuelType ||
                    "—"}
                </p>

              </div>

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

              {isViewMode
                ? "View the verification status of each submitted section."
                : "Review each submitted section independently."}

            </p>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">


              {/* =================================
                  BLUEBOOK
              ================================= */}

              <div
                id="bluebook"
                className="border rounded-xl p-5"
              >

                <div className="flex justify-between items-center">

                  <h3 className="font-bold text-lg">
                    📘 Bluebook
                  </h3>


                  <span
                    className={`px-3 py-1 rounded-full text-sm ${getStatusStyle(
                      sectionStatus.bluebook
                    )}`}
                  >
                    {bluebook
                      ? sectionStatus.bluebook
                      : "Not Added"}
                  </span>

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
                      {bluebook.bluebookNumber ||
                        "—"}
                    </p>


                    <p>
                      <strong>
                        Registration Date:
                      </strong>{" "}
                      {bluebook.registrationDate ||
                        "—"}
                    </p>


                    <p>
                      <strong>
                        Expiry Date:
                      </strong>{" "}
                      {bluebook.expiryDate ||
                        "—"}
                    </p>


                    <p>
                      <strong>
                        Engine Capacity:
                      </strong>{" "}
                      {bluebook.engineCapacity ||
                        "—"}
                    </p>


                    <p>
                      <strong>
                        Cylinders:
                      </strong>{" "}
                      {bluebook.cylinders ||
                        "—"}
                    </p>


                    <p>
                      <strong>
                        Seating Capacity:
                      </strong>{" "}
                      {bluebook["Seating Capacity"] ||
                        "—"}
                    </p>


                    <p>
                      <strong>
                        Fuel Type:
                      </strong>{" "}
                      {bluebook["Fuel Type"] ||
                        "—"}
                    </p>


                    {/* ADMIN CONTROLS */}

                    {!isViewMode &&
                      sectionStatus.bluebook === "Pending" && (

                        <div className="mt-5 flex gap-3">

                          <button
                            type="button"
                            onClick={() =>
                              updateSectionStatus(
                                "bluebook",
                                "Verified"
                              )
                            }
                            disabled={actionLoading}
                            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 rounded-xl font-semibold"
                          >
                            ✓ Verify Bluebook
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              updateSectionStatus(
                                "bluebook",
                                "Rejected"
                              )
                            }
                            disabled={actionLoading}
                            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-2 rounded-xl font-semibold"
                          >
                            ✕ Reject Bluebook
                          </button>

                        </div>

                      )}

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

              <div
                id="insurance"
                className="border rounded-xl p-5"
              >

                <div className="flex justify-between items-center">

                  <h3 className="font-bold text-lg">
                    🛡 Insurance
                  </h3>


                  <span
                    className={`px-3 py-1 rounded-full text-sm ${getStatusStyle(
                      sectionStatus.insurance
                    )}`}
                  >
                    {insurance
                      ? sectionStatus.insurance
                      : "Not Added"}
                  </span>

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
                      {insurance.category ||
                        "—"}
                    </p>


                    <p>
                      <strong>
                        Company:
                      </strong>{" "}
                      {insurance.company ||
                        "—"}
                    </p>


                    <p>
                      <strong>
                        Policy Number:
                      </strong>{" "}
                      {insurance.policyNumber ||
                        "—"}
                    </p>


                    <p>
                      <strong>
                        Valid Until:
                      </strong>{" "}
                      {insurance.validUntil ||
                        "—"}
                    </p>


                    {!isViewMode &&
                      sectionStatus.insurance === "Pending" && (

                        <div className="mt-5 flex gap-3">

                          <button
                            type="button"
                            onClick={() =>
                              updateSectionStatus(
                                "insurance",
                                "Verified"
                              )
                            }
                            disabled={actionLoading}
                            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 rounded-xl font-semibold"
                          >
                            ✓ Verify Insurance
                          </button>


                          <button
                            type="button"
                            onClick={() =>
                              updateSectionStatus(
                                "insurance",
                                "Rejected"
                              )
                            }
                            disabled={actionLoading}
                            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-2 rounded-xl font-semibold"
                          >
                            ✕ Reject Insurance
                          </button>

                        </div>

                      )}

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

              <div
                id="tax"
                className="border rounded-xl p-5"
              >

                <div className="flex justify-between items-center">

                  <h3 className="font-bold text-lg">
                    💰 Vehicle Tax
                  </h3>


                  <span
                    className={`px-3 py-1 rounded-full text-sm ${getStatusStyle(
                      sectionStatus.tax
                    )}`}
                  >
                    {tax
                      ? sectionStatus.tax
                      : "Not Added"}
                  </span>

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
                      {tax.receiptNumber ||
                        "—"}
                    </p>


                    <p>
                      <strong>
                        Paid Until:
                      </strong>{" "}
                      {tax.paidUntil ||
                        "—"}
                    </p>


                    <p>
                      <strong>
                        Status:
                      </strong>{" "}
                      {tax.status ||
                        "Pending Verification"}
                    </p>


                    {!isViewMode &&
                      sectionStatus.tax === "Pending" && (

                        <div className="mt-5 flex gap-3">

                          <button
                            type="button"
                            onClick={() =>
                              updateSectionStatus(
                                "tax",
                                "Verified"
                              )
                            }
                            disabled={actionLoading}
                            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 rounded-xl font-semibold"
                          >
                            ✓ Verify Tax
                          </button>


                          <button
                            type="button"
                            onClick={() =>
                              updateSectionStatus(
                                "tax",
                                "Rejected"
                              )
                            }
                            disabled={actionLoading}
                            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-2 rounded-xl font-semibold"
                          >
                            ✕ Reject Tax
                          </button>

                        </div>

                      )}

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
              FINAL ADMIN DECISION
          ===================================== */}

          {!isViewMode && (

            <div className="mt-10 border-t pt-8">

              <h2 className="text-xl font-bold">
                Admin Decision
              </h2>


              <p className="text-gray-500 mt-2">
                Approve the vehicle only after the
                submitted information has been checked.
              </p>


              {/* =================================
                  REJECTION REASON
              ================================= */}

              {vehicle.status !== "Verified" && (

                <div className="mt-6">

                  <label className="block font-semibold mb-2">
                    Rejection Reason
                  </label>


                  <textarea
                    value={rejectionReason}
                    onChange={(e) =>
                      setRejectionReason(
                        e.target.value
                      )
                    }
                    placeholder="Enter the reason if you reject this vehicle..."
                    rows="4"
                    className="w-full border rounded-xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
                  />


                  <p className="text-sm text-gray-500 mt-2">
                    A rejection reason is required
                    when rejecting a vehicle.
                  </p>

                </div>

              )}


              {/* =================================
                  FINAL BUTTONS
              ================================= */}

              <div className="flex flex-col md:flex-row gap-4 mt-6">

                <button
                  type="button"
                  onClick={() =>
                    updateVehicleStatus(
                      "Verified"
                    )
                  }
                  disabled={actionLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 rounded-xl font-semibold"
                >
                  {actionLoading
                    ? "Processing..."
                    : "✓ Approve & Verify"}
                </button>


                <button
                  type="button"
                  onClick={() =>
                    updateVehicleStatus(
                      "Rejected"
                    )
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

          )}

        </div>

      </div>

    </AdminLayout>
  );

}



export default VehicleReview;