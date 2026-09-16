import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/firebase";


// ==========================================
// CREATE ADMIN NOTIFICATION
// ==========================================

export const createAdminNotification = async ({
  vehicleId,
  reportId,
  vehicleNumber,
  ownerId,
  ownerName,
  documentType,

  // Optional notification customization
  type = "document_resubmission",
  category = "documents",
  title = "Document Resubmitted",
  message,
}) => {

  console.log(
    "🔔 createAdminNotification CALLED",
    {
      vehicleId,
      vehicleNumber,
      ownerId,
      ownerName,
      documentType,
      type,
      category,
    }
  );


  // ==========================================
  // VALIDATION
  // ==========================================

  if (!vehicleId) {
    throw new Error(
      "Vehicle ID is required."
    );
  }


  // ==========================================
  // DEFAULT TITLES / MESSAGES
  // ==========================================

  const finalTitle =
    title ||
    (
      type === "document_submission"
        ? `New ${documentType} Submitted`
        : "Document Resubmitted"
    );


  const finalMessage =
    message ||
    (
      type === "document_submission"
        ? `${documentType} for ${vehicleNumber || "vehicle"} has been submitted for verification.`
        : `${documentType} has been resubmitted for verification.`
    );


  // ==========================================
  // NOTIFICATION DATA
  // ==========================================

  const notificationData = {
    type,
    category,
    documentType: documentType || "",

    reportId:
      reportId || "",

    vehicleId,
    vehicleNumber: vehicleNumber || "",

    ownerId: ownerId || "",
    ownerName: ownerName || "",

    title:
      finalTitle,

    message:
      finalMessage,

    read: false,

    createdAt: serverTimestamp(),
  };


  console.log(
    "🔔 Attempting Firestore notification write...",
    notificationData
  );


  try {

    const notificationRef =
      await addDoc(
        collection(
          db,
          "adminNotifications"
        ),
        notificationData
      );


    console.log(
      "✅ ADMIN NOTIFICATION CREATED:",
      notificationRef.id
    );


    return notificationRef.id;

  } catch (error) {

    console.error(
      "❌ ADMIN NOTIFICATION FAILED:",
      error
    );

    throw error;
  }

};