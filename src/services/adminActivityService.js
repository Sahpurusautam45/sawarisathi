import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/firebase";


// ==========================================
// CREATE ADMIN ACTIVITY
// ==========================================

export const createAdminActivity = async ({
  action,
  entityType,
  entityId,
  vehicleNumber = null,
  reportType = null,
  reason = null,
}) => {
  try {

    await addDoc(
      collection(db, "adminActivity"),
      {
        action,
        entityType,
        entityId,
        vehicleNumber,
        reportType,
        reason,
        createdAt: serverTimestamp(),
      }
    );

  } catch (error) {

    console.error(
      "Admin Activity Error:",
      error
    );

    // Audit failure should not stop
    // the main Admin action.
  }
};