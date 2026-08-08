import { auth, db } from "../firebase/firebase";

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";


// ==========================================
// SAVE TAX
// ==========================================

export const saveTax = async (
  vehicleId,
  taxData
) => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User not logged in.");
  }

  if (!vehicleId) {
    throw new Error("Vehicle ID is required.");
  }

  // NEW LOCATION
  const taxRef = doc(
    db,
    "vehicles",
    vehicleId,
    "tax",
    "details"
  );

  await setDoc(taxRef, {
    ...taxData,
    updatedAt: serverTimestamp(),
  });
};


// ==========================================
// GET TAX
// ==========================================

export const getTax = async (
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

  const newTaxRef = doc(
    db,
    "vehicles",
    vehicleId,
    "tax",
    "details"
  );

  const newSnapshot = await getDoc(
    newTaxRef
  );

  if (newSnapshot.exists()) {
    return newSnapshot.data();
  }


  // ========================================
  // 2. CHECK OLD LOCATION
  // ========================================

  const oldTaxRef = doc(
    db,
    "users",
    user.uid,
    "vehicles",
    vehicleId,
    "tax",
    "details"
  );

  const oldSnapshot = await getDoc(
    oldTaxRef
  );


  // ========================================
  // 3. MIGRATE OLD → NEW
  // ========================================

  if (oldSnapshot.exists()) {

    const oldData = oldSnapshot.data();

    await setDoc(
      newTaxRef,
      {
        ...oldData,
        migratedAt: serverTimestamp(),
      },
      {
        merge: true,
      }
    );

    return oldData;
  }


  // ========================================
  // NOTHING FOUND
  // ========================================

  return null;
};