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

  const bluebookRef = doc(
    db,
    "users",
    user.uid,
    "vehicles",
    vehicleId,
    "bluebook",
    "details"
  );

  await setDoc(bluebookRef, {
    ...bluebookData,
    createdAt: serverTimestamp(),
  });
};

export const getBluebook = async (vehicleId) => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User not logged in.");
  }

  const bluebookRef = doc(
    db,
    "users",
    user.uid,
    "vehicles",
    vehicleId,
    "bluebook",
    "details"
  );

  const docSnap = await getDoc(bluebookRef);

  if (docSnap.exists()) {
    return docSnap.data();
  }

  return null;
};