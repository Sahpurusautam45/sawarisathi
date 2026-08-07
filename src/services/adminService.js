import {
  collection,
  collectionGroup,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

export const getDashboardStats = async () => {
  try {
    const [usersSnapshot, vehiclesSnapshot] = await Promise.all([
      getCountFromServer(collection(db, "users")),
      getCountFromServer(collectionGroup(db, "vehicles")),
    ]);

    return {
      totalUsers: usersSnapshot.data().count,
      totalVehicles: vehiclesSnapshot.data().count,

      // We'll implement these next
      pendingVehicles: 0,
      verifiedVehicles: 0,
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
};