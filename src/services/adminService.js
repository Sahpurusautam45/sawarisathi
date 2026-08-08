import {
  collection,
  getCountFromServer,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "../firebase/firebase";

// ==============================
// Dashboard Statistics
// ==============================
export const getDashboardStats = async () => {
  try {
    // Total users
    const usersSnapshot = await getCountFromServer(
      collection(db, "users")
    );

    // All vehicles
    const vehiclesRef = collection(db, "vehicles");

    const vehiclesSnapshot = await getCountFromServer(
      vehiclesRef
    );

    // Pending vehicles
    const pendingQuery = query(
      vehiclesRef,
      where("status", "==", "Pending")
    );

    const pendingSnapshot = await getCountFromServer(
      pendingQuery
    );

    // Verified vehicles
    const verifiedQuery = query(
      vehiclesRef,
      where("status", "==", "Verified")
    );

    const verifiedSnapshot = await getCountFromServer(
      verifiedQuery
    );

    return {
      totalUsers: usersSnapshot.data().count,
      totalVehicles: vehiclesSnapshot.data().count,
      pendingVehicles: pendingSnapshot.data().count,
      verifiedVehicles: verifiedSnapshot.data().count,
    };
  } catch (error) {
    console.error("Dashboard Error:", error);
    throw error;
  }
};


// ==============================
// Pending Vehicles
// ==============================
export const getPendingVehicles = async () => {
  try {
    const vehiclesRef = collection(db, "vehicles");

    const pendingQuery = query(
      vehiclesRef,
      where("status", "==", "Pending")
    );

    const snapshot = await getDocs(
      pendingQuery
    );

    const vehicles = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(
      "Pending Vehicles:",
      vehicles
    );

    return vehicles;
  } catch (error) {
    console.error(
      "Pending Vehicle Error:",
      error
    );

    throw error;
  }
};