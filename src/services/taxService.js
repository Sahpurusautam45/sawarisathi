import { auth, db } from "../firebase/firebase";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";

export const saveTax = async (vehicleId, taxData) => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User not logged in.");
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

export const getTax = async (vehicleId) => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User not logged in.");
  }

  // FIRST: NEW LOCATION
  const newRef = doc(
    db,
    "vehicles",
    vehicleId,
    "tax",
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
    "tax",
    "details"
  );

  const oldSnap = await getDoc(oldRef);

  if (oldSnap.exists()) {
    return oldSnap.data();
  }

  return null;
};