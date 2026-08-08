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

  // FIRST: NEW LOCATION
  const newRef = doc(
    db,
    "vehicles",
    vehicleId,
    "insurance",
    "details"
  );

  const newSnap = await getDoc(newRef);

  if (newSnap.exists()) {
    return newSnap.data();
  }

  // FALLBACK: OLD LOCATION
  const oldRef = doc(
    db,
    "users",
    user.uid,
    "vehicles",
    vehicleId,
    "insurance",
    "details"
  );

  const oldSnap = await getDoc(oldRef);

  if (oldSnap.exists()) {
    return oldSnap.data();
  }

  return null;
};