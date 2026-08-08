import { auth, db } from "../firebase/firebase";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";

export const saveInsurance = async (vehicleId, insuranceData) => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User not logged in.");
  }

  // NEW LOCATION
  const insuranceRef = doc(
    db,
    "vehicles",
    vehicleId,
    "insurance",
    "details"
  );

  await setDoc(insuranceRef, {
    ...insuranceData,
    status: "Pending Verification",
    updatedAt: serverTimestamp(),
  });
};

export const getInsurance = async (vehicleId) => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User not logged in.");
  }

  if (!vehicleId) {
    throw new Error("Vehicle ID is required.");
  }

  // ========================================
  // NEW LOCATION
  // vehicles/{vehicleId}/insurance/details
  // ========================================

  const newInsuranceRef = doc(
    db,
    "vehicles",
    vehicleId,
    "insurance",
    "details"
  );

  const newSnapshot = await getDoc(
    newInsuranceRef
  );

  if (newSnapshot.exists()) {
    return newSnapshot.data();
  }

  // ========================================
  // OLD LOCATION
  // users/{uid}/vehicles/{vehicleId}/insurance/details
  // ========================================

  const oldInsuranceRef = doc(
    db,
    "users",
    user.uid,
    "vehicles",
    vehicleId,
    "insurance",
    "details"
  );

  const oldSnapshot = await getDoc(
    oldInsuranceRef
  );

  if (oldSnapshot.exists()) {

    const oldData = oldSnapshot.data();

    // ======================================
    // MIGRATE OLD → NEW
    // ======================================

    await setDoc(
      newInsuranceRef,
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

  return null;
};