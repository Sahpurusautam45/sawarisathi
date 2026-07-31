import { auth, db } from "../firebase/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getDoc } from "firebase/firestore";

export const saveInsurance = async (vehicleId, insuranceData) => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User not logged in.");
  }

  const insuranceRef = doc(
    db,
    "users",
    user.uid,
    "vehicles",
    vehicleId,
    "insurance",
    "details"
  );

  await setDoc(insuranceRef, {
    ...insuranceData,
    status: "Pending Verification",
    createdAt: serverTimestamp(),
  });
};

export const getInsurance = async (vehicleId) => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User not logged in.");
  }

  const insuranceRef = doc(
    db,
    "users",
    user.uid,
    "vehicles",
    vehicleId,
    "insurance",
    "details"
  );

  const docSnap = await getDoc(insuranceRef);

  if (docSnap.exists()) {
    return docSnap.data();
  }

  return null;
};