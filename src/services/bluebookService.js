import { auth, db } from "../firebase/firebase";

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";


// ==========================================
// SAVE BLUEBOOK
// ==========================================

export const saveBluebook = async (
  vehicleId,
  bluebookData
) => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User not logged in.");
  }

  if (!vehicleId) {
    throw new Error("Vehicle ID is required.");
  }

  // NEW LOCATION
  const bluebookRef = doc(
    db,
    "vehicles",
    vehicleId,
    "bluebook",
    "details"
  );

  await setDoc(bluebookRef, {
    ...bluebookData,
    updatedAt: serverTimestamp(),
  });
};


// ==========================================
// GET BLUEBOOK
// ==========================================

export const getBluebook = async (
  vehicleId
) => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User not logged in.");
  }

  if (!vehicleId) {
    throw new Error("Vehicle ID is required.");
  }


  // ========================================
  // 1. CHECK NEW LOCATION
  // ========================================

  const newBluebookRef = doc(
    db,
    "vehicles",
    vehicleId,
    "bluebook",
    "details"
  );

  const newSnapshot = await getDoc(
    newBluebookRef
  );

  if (newSnapshot.exists()) {
    return newSnapshot.data();
  }


  // ========================================
  // 2. CHECK OLD LOCATION
  // ========================================

  const oldBluebookRef = doc(
    db,
    "users",
    user.uid,
    "vehicles",
    vehicleId,
    "bluebook",
    "details"
  );

  const oldSnapshot = await getDoc(
    oldBluebookRef
  );


  if (oldSnapshot.exists()) {

    const oldData = oldSnapshot.data();


    // ======================================
    // 3. MIGRATE OLD → NEW
    // ======================================

    await setDoc(
      newBluebookRef,
      {
        ...oldData,
        migratedAt: serverTimestamp(),
      },
      {
        merge: true,
      }
    );


    // ======================================
    // 4. RETURN EXISTING DATA
    // ======================================

    return oldData;
  }


  // ========================================
  // NOTHING FOUND
  // ========================================

  return null;
};