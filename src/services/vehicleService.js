import { db, auth } from "../firebase/firebase";

import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

// Save Vehicle
export const addVehicle = async (vehicleData) => {
  const user = auth.currentUser;

  if (!user) throw new Error("User not logged in.");

  return await addDoc(
    collection(db, "users", user.uid, "vehicles"),
    {
      ...vehicleData,
      createdAt: serverTimestamp(),
    }
  );
};

// Get Vehicles
export const getVehicles = async () => {
  const user = auth.currentUser;

  if (!user) throw new Error("User not logged in.");

  const snapshot = await getDocs(
    collection(db, "users", user.uid, "vehicles")
  );

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

// Update Vehicle
export const updateVehicle = async (vehicleId, vehicleData) => {
  const user = auth.currentUser;

  if (!user) throw new Error("User not logged in.");

  const vehicleRef = doc(
    db,
    "users",
    user.uid,
    "vehicles",
    vehicleId
  );

  await updateDoc(vehicleRef, vehicleData);
};