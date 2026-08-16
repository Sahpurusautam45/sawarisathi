import {
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
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


// ==============================
// MASK OWNER NAME
// ==============================
const maskOwnerName = (name) => {
  if (!name) return "Not Available";

  const parts = name.trim().split(/\s+/);

  return parts
    .map((part) => {
      if (part.length <= 1) {
        return part;
      }

      return (
        part.charAt(0) +
        "*".repeat(
          Math.max(1, part.length - 1)
        )
      );
    })
    .join(" ");
};


// ==============================
// SYNC VERIFIED VEHICLES
// TO PUBLIC VEHICLES
// ==============================
export const syncVerifiedVehiclesToPublic =
  async () => {
    try {
      console.log(
        "Starting verified vehicle sync..."
      );

      // ==========================================
      // GET ALL PRIVATE VEHICLES
      // ==========================================

      const vehiclesSnapshot =
        await getDocs(
          collection(db, "vehicles")
        );

      const verifiedVehicles =
        vehiclesSnapshot.docs.filter(
          (vehicleDoc) =>
            vehicleDoc.data().status ===
            "Verified"
        );

      console.log(
        "Verified vehicles found:",
        verifiedVehicles.length
      );


      // ==========================================
      // CREATE / UPDATE PUBLIC RECORDS
      // ==========================================

      for (const vehicleDoc of verifiedVehicles) {
        const vehicleId = vehicleDoc.id;
        const vehicle =
          vehicleDoc.data();

        // ------------------------------
        // BLUEBOOK
        // ------------------------------

        const bluebookRef = doc(
          db,
          "vehicles",
          vehicleId,
          "bluebook",
          "details"
        );

        const bluebookSnap =
          await getDoc(bluebookRef);

        const bluebook =
          bluebookSnap.exists()
            ? bluebookSnap.data()
            : null;


        // ------------------------------
        // INSURANCE
        // ------------------------------

        const insuranceRef = doc(
          db,
          "vehicles",
          vehicleId,
          "insurance",
          "details"
        );

        const insuranceSnap =
          await getDoc(insuranceRef);

        const insurance =
          insuranceSnap.exists()
            ? insuranceSnap.data()
            : null;


        // ------------------------------
        // TAX
        // ------------------------------

        const taxRef = doc(
          db,
          "vehicles",
          vehicleId,
          "tax",
          "details"
        );

        const taxSnap =
          await getDoc(taxRef);

        const tax =
          taxSnap.exists()
            ? taxSnap.data()
            : null;


        // ==========================================
        // PUBLIC-SAFE DATA
        // ==========================================

        const publicVehicleData = {

          // Basic vehicle information
          vehicleNumber:
            vehicle.vehicleNumber || "",

          vehicleType:
            vehicle.vehicleType || "",

          brand:
            vehicle.brand || "",

          model:
            vehicle.model || "",

          color:
            vehicle.color || "",


          // Masked owner name
          ownerNameMasked:
            maskOwnerName(
              vehicle.ownerName
            ),


          // Verification
          status: "Verified",

          verificationBadge: true,


          // Security
          stolenStatus:
            "Not Reported",


          // Bluebook
          registrationDate:
            bluebook?.registrationDate ||
            null,

          bluebookExpiry:
            bluebook?.expiryDate ||
            null,


          // Vehicle specifications
          engineCapacity:
            bluebook?.engineCapacity ||
            null,

          cylinders:
            bluebook?.cylinders ||
            null,

          seatingCapacity:
            bluebook?.["Seating Capacity"] ||
            null,

          fuelType:
            bluebook?.["Fuel Type"] ||
            null,


          // Insurance
          insuranceStatus:
            insurance
              ? insurance.status ||
                "Submitted"
              : "Not Added",

          insuranceExpiry:
            insurance?.validUntil ||
            null,


          // Tax
          taxStatus:
            tax
              ? tax.status ||
                "Submitted"
              : "Not Added",

          taxExpiry:
            tax?.paidUntil ||
            null,


          // Public timestamps
          verifiedAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),

          createdFrom:
            "SawariSathi Verified Vehicle Sync",
        };


        // ==========================================
        // SAVE PUBLIC VEHICLE
        // ==========================================

        const publicVehicleRef =
          doc(
            db,
            "publicVehicles",
            vehicleId
          );

        await setDoc(
          publicVehicleRef,
          publicVehicleData
        );

        console.log(
          `Public vehicle synced: ${vehicle.vehicleNumber}`
        );
      }


      // ==========================================
      // REMOVE PUBLIC RECORDS THAT ARE NOT VERIFIED
      // ==========================================

      const publicVehiclesSnapshot =
        await getDocs(
          collection(
            db,
            "publicVehicles"
          )
        );


      for (
        const publicVehicleDoc
        of publicVehiclesSnapshot.docs
      ) {

        const vehicleId =
          publicVehicleDoc.id;

        const privateVehicleRef =
          doc(
            db,
            "vehicles",
            vehicleId
          );

        const privateVehicleSnap =
          await getDoc(
            privateVehicleRef
          );


        // Vehicle doesn't exist anymore
        // OR vehicle is not verified
        if (
          !privateVehicleSnap.exists() ||
          privateVehicleSnap.data().status !==
            "Verified"
        ) {

          await deleteDoc(
            publicVehicleDoc.ref
          );

          console.log(
            `Removed non-verified public vehicle: ${vehicleId}`
          );
        }
      }


      console.log(
        "Verified vehicle sync completed successfully."
      );

      return {
        success: true,
        syncedCount:
          verifiedVehicles.length,
      };

    } catch (error) {

      console.error(
        "Verified Vehicle Sync Error:",
        error
      );

      throw error;
    }
  };