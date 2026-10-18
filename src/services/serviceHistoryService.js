import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    serverTimestamp,
    query,
    orderBy,
    getDoc,
    runTransaction,
} from "firebase/firestore";

import { db } from "../firebase/firebase";

// ==========================================
// ADD SERVICE RECORD
// ==========================================

export const addServiceRecord = async (vehicleId, serviceData) => {
    const serviceRef = collection(
        db,
        "vehicles",
        vehicleId,
        "serviceHistory"
    );

    // Generate a permanent sequential service number.
    const counterRef = doc(
        db,
        "vehicles",
        vehicleId,
        "serviceHistoryMetadata",
        "counter"
    );

    const serviceNumber = await runTransaction(db, async (transaction) => {
        const counterSnapshot = await transaction.get(counterRef);

        const nextNumber = counterSnapshot.exists()
            ? (counterSnapshot.data().lastServiceNumber || 0) + 1
            : 1;

        transaction.set(counterRef, {
            lastServiceNumber: nextNumber,
        });

        return nextNumber;
    });

    const docRef = await addDoc(serviceRef, {
        ...serviceData,
        serviceNumber,
        editUsed: false,
        createdAt: serverTimestamp(),
    });

    return docRef.id;
};


// ==========================================
// GET SERVICE HISTORY
// ==========================================

export const getServiceHistory = async (vehicleId) => {
    const serviceRef = collection(
        db,
        "vehicles",
        vehicleId,
        "serviceHistory"
    );

    const q = query(
        serviceRef,
        orderBy("serviceNumber", "asc")
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((serviceDoc) => ({
        id: serviceDoc.id,
        ...serviceDoc.data(),
    }));
};


// ==========================================
// DELETE SERVICE RECORD
// ==========================================

export const deleteServiceRecord = async (vehicleId, serviceId) => {
    const serviceRef = doc(
        db,
        "vehicles",
        vehicleId,
        "serviceHistory",
        serviceId
    );

    await deleteDoc(serviceRef);
};


// ==========================================
// UPDATE SERVICE RECORD ONCE
// ==========================================

export const updateServiceRecord = async (
    vehicleId,
    serviceId,
    serviceData
) => {
    const serviceRef = doc(
        db,
        "vehicles",
        vehicleId,
        "serviceHistory",
        serviceId
    );

    const historyRef = collection(
        db,
        "vehicles",
        vehicleId,
        "serviceHistory",
        serviceId,
        "editHistory"
    );

    return await runTransaction(db, async (transaction) => {
        const serviceSnapshot = await transaction.get(serviceRef);

        if (!serviceSnapshot.exists()) {
            throw new Error("Service record not found.");
        }

        const oldData = serviceSnapshot.data();

        // Prevent a second edit.
        if (oldData.editUsed === true) {
            throw new Error(
                "This service record has already been edited once."
            );
        }

        const trackedFields = [
            "serviceDate",
            "kilometer",
            "serviceType",
            "workDone",
            "cost",
            "garage",
            "notes",
        ];

        const changes = {};

        trackedFields.forEach((field) => {
            const oldValue = oldData[field] ?? "";
            const newValue = serviceData[field] ?? "";

            if (oldValue !== newValue) {
                changes[field] = {
                    oldValue,
                    newValue,
                };
            }
        });

        // An unchanged submission does not consume the edit.
        if (Object.keys(changes).length === 0) {
            return {
                success: true,
                changed: false,
            };
        }

        const historyDoc = doc(historyRef);

        transaction.set(historyDoc, {
            changes,
            editedAt: serverTimestamp(),
        });

        transaction.update(serviceRef, {
            ...serviceData,
            editUsed: true,
            updatedAt: serverTimestamp(),
        });

        return {
            success: true,
            changed: true,
        };
    });
};