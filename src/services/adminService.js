import {
  collection,
  getCountFromServer,
  getDocs,
} from "firebase/firestore";

import { db, auth } from "../firebase/firebase";

// ==============================
// Dashboard Statistics
// ==============================
export const getDashboardStats = async () => {
  try {
    const usersSnapshot = await getCountFromServer(
      collection(db, "users")
    );

    const vehiclesSnapshot = await getDocs(
      collection(db, "users", auth.currentUser.uid, "vehicles")
    );

    return {
      totalUsers: usersSnapshot.data().count,
      totalVehicles: vehiclesSnapshot.size,
      pendingVehicles: 0,
      verifiedVehicles: 0,
    };
  } catch (error) {
    console.error("Dashboard Error:", error);
    throw error;
  }
};

// ==============================
// Pending Vehicles (TEST VERSION)
// ==============================
export const getPendingVehicles = async () => {
  try {
    const snapshot = await getDocs(
      collection(db, "users", auth.currentUser.uid, "vehicles")
    );

    const vehicles = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log("Vehicles:", vehicles);

    return vehicles;
  } catch (error) {
    console.error("Vehicle Error:", error);
    throw error;
  }
};