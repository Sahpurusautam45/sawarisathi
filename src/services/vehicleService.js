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

import {
  createAdminNotification,
} from "./adminNotificationService";


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
    throw new Error(
      "Vehicle number is required."
    );
  }


  // ==========================================
  // CHECK IF VEHICLE ALREADY EXISTS
  // ==========================================

  const existingVehicleQuery = query(
    collection(db, "vehicles"),
    where(
      "vehicleNumber",
      "==",
      cleanVehicleNumber
    )
  );


  const existingVehicleSnapshot =
    await getDocs(
      existingVehicleQuery
    );


  // Check every existing record

  for (
    const existingVehicleDoc
    of existingVehicleSnapshot.docs
  ) {

    const existingVehicle =
      existingVehicleDoc.data();


    const existingStatus =
      existingVehicle.status;


    // ========================================
    // VERIFIED VEHICLE
    // ========================================

    if (
      existingStatus ===
      "Verified"
    ) {

      throw new Error(
        "VEHICLE_ALREADY_REGISTERED"
      );

    }


    // ========================================
    // PENDING VEHICLE
    // ========================================

    if (
      existingStatus ===
      "Pending"
    ) {

      throw new Error(
        "VEHICLE_ALREADY_REGISTERED"
      );

    }


    // ========================================
    // REJECTED VEHICLE
    // ========================================
    // Rejected vehicles are allowed
    // to be submitted again.

  }


  // ==========================================
  // GET USER INFORMATION
  // ==========================================

  const userRef = doc(
    db,
    "users",
    user.uid
  );


  const userSnap =
    await getDoc(userRef);


  if (!userSnap.exists()) {

    throw new Error(
      "User profile not found."
    );

  }


  const userInfo =
    userSnap.data();


  // ==========================================
  // CREATE VEHICLE
  // ==========================================

  const vehicleRef =
    await addDoc(
      collection(
        db,
        "vehicles"
      ),

      {

        ownerId:
          user.uid,

        ownerName:
          userInfo.fullName,

        ownerEmail:
          userInfo.email,

        ...vehicleData,

        // Always store normalized number

        vehicleNumber:
          cleanVehicleNumber,

        status:
          "Pending",

        remarks:
          "",

        verifiedBy:
          "",

        verifiedAt:
          null,

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp(),

      }
    );


  // ==========================================
  // 🔔 NEW VEHICLE ADMIN NOTIFICATION
  // ==========================================

  try {

    await createAdminNotification({

      vehicleId:
        vehicleRef.id,

      vehicleNumber:
        cleanVehicleNumber,

      ownerId:
        user.uid,

      ownerName:
        userInfo.fullName || "",

      documentType:
        "Vehicle",

      type:
        "vehicle_submission",

      category:
        "vehicles",

      title:
        "New Vehicle Submitted",

      message:
        `${cleanVehicleNumber} has been submitted for verification.`,

    });


    console.log(
      "✅ New vehicle admin notification created."
    );

  } catch (notificationError) {

    // Notification failure should NOT
    // cancel the successfully created vehicle.

    console.error(
      "❌ Vehicle notification failed:",
      notificationError
    );

  }


  // ==========================================
  // RETURN CREATED VEHICLE
  // ==========================================

  return vehicleRef;

};


// =============================
// Get My Vehicles
// =============================
export const getVehicles = async () => {

  const user =
    auth.currentUser;


  if (!user) {

    throw new Error(
      "User not logged in."
    );

  }


  const q =
    query(
      collection(
        db,
        "vehicles"
      ),

      where(
        "ownerId",
        "==",
        user.uid
      )
    );


  const snapshot =
    await getDocs(q);


  return snapshot.docs.map(
    (doc) => ({

      id:
        doc.id,

      ...doc.data(),

    })
  );

};


// =============================
// Update Vehicle
// =============================
export const updateVehicle =
  async (
    vehicleId,
    vehicleData
  ) => {

    const vehicleRef =
      doc(
        db,
        "vehicles",
        vehicleId
      );


    await updateDoc(
      vehicleRef,

      {

        ...vehicleData,

        updatedAt:
          serverTimestamp(),

      }
    );

  };


// =============================
// Delete Vehicle
// =============================
export const removeVehicle =
  async (
    vehicleId
  ) => {

    const vehicleRef =
      doc(
        db,
        "vehicles",
        vehicleId
      );


    await deleteDoc(
      vehicleRef
    );

  };