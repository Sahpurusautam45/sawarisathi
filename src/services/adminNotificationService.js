import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/firebase";

export const createAdminNotification = async ({
  vehicleId,
  vehicleNumber,
  ownerId,
  ownerName,
  documentType,
}) => {

  console.log(
    "🔔 createAdminNotification CALLED",
    {
      vehicleId,
      vehicleNumber,
      ownerId,
      ownerName,
      documentType,
    }
  );

  if (!vehicleId) {
    throw new Error("Vehicle ID is required.");
  }

  const notificationData = {
    type: "document_resubmission",
    documentType,

    vehicleId,
    vehicleNumber: vehicleNumber || "",

    ownerId: ownerId || "",
    ownerName: ownerName || "",

    title: "Document Resubmitted",

    message:
      `${documentType} has been resubmitted for verification.`,

    read: false,

    createdAt: serverTimestamp(),
  };

  console.log(
    "🔔 Attempting Firestore notification write...",
    notificationData
  );

  try {

    const notificationRef = await addDoc(
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