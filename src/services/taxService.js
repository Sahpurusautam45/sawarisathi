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

  const taxRef = doc(
    db,
    "users",
    user.uid,
    "vehicles",
    vehicleId,
    "tax",
    "details"
  );

  await setDoc(taxRef, {
    ...taxData,
    createdAt: serverTimestamp(),
  });
};

export const getTax = async (vehicleId) => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User not logged in.");
  }

  const taxRef = doc(
    db,
    "users",
    user.uid,
    "vehicles",
    vehicleId,
    "tax",
    "details"
  );

  const docSnap = await getDoc(taxRef);

  if (docSnap.exists()) {
    return docSnap.data();
  }

  return null;
};