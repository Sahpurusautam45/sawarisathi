import { db, auth } from "../firebase/firebase";

import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";

// =============================
// Add Vehicle
// =============================
export const addVehicle = async (vehicleData) => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User not logged in.");
  }

  // ==========================================
  // NORMALIZE VEHICLE NUMBER
  // ==========================================

  const cleanVehicleNumber = (
    vehicleData.vehicleNumber || ""
  )
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();

  if (!cleanVehicleNumber) {
    throw new Error("Vehicle number is required.");
  }

  // ==========================================
  // CHECK IF VEHICLE ALREADY EXISTS
  // ==========================================

  const existingVehicleQuery = query(
    collection(db, "vehicles"),
    where("vehicleNumber", "==", cleanVehicleNumber)
  );

  const existingVehicleSnapshot = await getDocs(
    existingVehicleQuery
  );

  if (!existingVehicleSnapshot.empty) {
    throw new Error(
      "VEHICLE_ALREADY_REGISTERED"
    );
  }

  // ==========================================
  // GET USER INFORMATION
  // ==========================================

  const userRef = doc(
    db,
    "users",
    user.uid
  );

  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    throw new Error(
      "User profile not found."
    );
  }

  const userInfo = userSnap.data();

  // ==========================================
  // CREATE VEHICLE
  // ==========================================

  return await addDoc(
    collection(db, "vehicles"),
    {
      ownerId: user.uid,

      ownerName:
        userInfo.fullName,

      ownerEmail:
        userInfo.email,

      ...vehicleData,

      // Always store normalized number
      vehicleNumber:
        cleanVehicleNumber,

      status: "Pending",

      remarks: "",

      verifiedBy: "",

      verifiedAt: null,

      createdAt:
        serverTimestamp(),

      updatedAt:
        serverTimestamp(),
    }
  );
};

// =============================
// Get My Vehicles
// =============================
export const getVehicles = async () => {
  const user = auth.currentUser;

  if (!user) throw new Error("User not logged in.");

  const q = query(
    collection(db, "vehicles"),
    where("ownerId", "==", user.uid)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

// =============================
// Update Vehicle
// =============================
export const updateVehicle = async (vehicleId, vehicleData) => {
  const vehicleRef = doc(db, "vehicles", vehicleId);

  await updateDoc(vehicleRef, {
    ...vehicleData,
    updatedAt: serverTimestamp(),
  });
};

// =============================
// Delete Vehicle
// =============================
export const removeVehicle = async (vehicleId) => {
  const vehicleRef = doc(db, "vehicles", vehicleId);

  await deleteDoc(vehicleRef);
};