import {
  collection,
  collectionGroup,
  getCountFromServer,
} from "firebase/firestore";

import { db } from "../firebase/firebase";

export const getDashboardStats = async () => {
  try {
    const usersSnapshot = await getCountFromServer(collection(db, "users"));

    const vehiclesSnapshot = await getCountFromServer(
      collectionGroup(db, "vehicles")
    );

    return {
      totalUsers: usersSnapshot.data().count,
      totalVehicles: vehiclesSnapshot.data().count,
    };
  } catch (error) {
    console.error("Dashboard Error:", error);
    throw error;
  }
};