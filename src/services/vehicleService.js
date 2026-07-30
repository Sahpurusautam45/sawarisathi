import { db, auth } from "../firebase/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export const addVehicle = async (vehicleData) => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User not logged in.");
  }

  return await addDoc(
    collection(db, "users", user.uid, "vehicles"),
    {
      ...vehicleData,
      createdAt: serverTimestamp(),
    }
  );
};