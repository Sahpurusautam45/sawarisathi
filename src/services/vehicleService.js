import { db, auth } from "../firebase/firebase";

import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

// Save Vehicle
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

// Get All Vehicles
export const getVehicles = async () => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User not logged in.");
  }

  const snapshot = await getDocs(
    collection(db, "users", user.uid, "vehicles")
  );

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};