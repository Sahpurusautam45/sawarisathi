import { auth, db } from "../firebase/firebase";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";

export const saveBluebook = async (vehicleId, bluebookData) => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User not logged in.");
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

export const getBluebook = async (vehicleId) => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User not logged in.");
  }

  // FIRST: NEW LOCATION
  const newRef = doc(
    db,
    "vehicles",
    vehicleId,
    "bluebook",
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
    "bluebook",
    "details"
  );

  const oldSnap = await getDoc(oldRef);

  if (oldSnap.exists()) {
    return oldSnap.data();
  }

  return null;
};