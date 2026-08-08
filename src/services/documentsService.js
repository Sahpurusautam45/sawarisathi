import { auth, db, storage } from "../firebase/firebase";

import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";


// ==========================================
// UPLOAD DOCUMENT
// ==========================================

export const uploadVehicleDocument = async (
  vehicleId,
  file,
  documentType
) => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User not logged in.");
  }

  if (!file) {
    throw new Error("No file selected.");
  }

  if (!vehicleId) {
    throw new Error("Vehicle ID is required.");
  }

  // Firebase Storage location
  const storagePath = `vehicles/${vehicleId}/documents/${user.uid}/${Date.now()}_${file.name}`;

  const storageRef = ref(storage, storagePath);

  // Upload actual file
  await uploadBytes(storageRef, file);

  // Get downloadable URL
  const downloadURL = await getDownloadURL(storageRef);

  // Firestore metadata
  const documentsRef = collection(
    db,
    "vehicles",
    vehicleId,
    "documents"
  );

  const documentData = {
    documentType,
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    downloadURL,
    storagePath,
    uploadedBy: user.uid,
    status: "Pending Verification",
    createdAt: serverTimestamp(),
  };

  const documentRef = await addDoc(
    documentsRef,
    documentData
  );

  return {
    id: documentRef.id,
    ...documentData,
  };
};


// ==========================================
// GET VEHICLE DOCUMENTS
// ==========================================

export const getVehicleDocuments = async (vehicleId) => {
  if (!vehicleId) {
    throw new Error("Vehicle ID is required.");
  }

  const documentsRef = collection(
    db,
    "vehicles",
    vehicleId,
    "documents"
  );

  const q = query(
    documentsRef,
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};