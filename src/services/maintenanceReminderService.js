import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/firebase";

// ==========================================
// REMINDER COLLECTION
// ==========================================

const getReminderCollection = (vehicleId) =>
    collection(
        db,
        "vehicles",
        vehicleId,
        "maintenanceReminders"
    );

// ==========================================
// ADD MAINTENANCE REMINDER
// ==========================================

export const addMaintenanceReminder = async (
    vehicleId,
    reminderData
) => {
    const remindersRef = getReminderCollection(vehicleId);

    const docRef = await addDoc(remindersRef, {
        title: reminderData.title.trim(),
        reminderType: reminderData.reminderType,
        dueDate: reminderData.dueDate || "",
        dueKilometer:
            reminderData.dueKilometer === "" ||
            reminderData.dueKilometer === null ||
            reminderData.dueKilometer === undefined
                ? null
                : Number(reminderData.dueKilometer),
        currentKilometer:
            reminderData.currentKilometer === "" ||
            reminderData.currentKilometer === null ||
            reminderData.currentKilometer === undefined
                ? null
                : Number(reminderData.currentKilometer),
        notes: (reminderData.notes || "").trim(),
        completed: false,
        createdAt: serverTimestamp(),
    });

    return docRef.id;
};

// ==========================================
// GET MAINTENANCE REMINDERS
// ==========================================

export const getMaintenanceReminders = async (vehicleId) => {
    const remindersRef = getReminderCollection(vehicleId);

    const q = query(
        remindersRef,
        orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((reminderDoc) => ({
        id: reminderDoc.id,
        ...reminderDoc.data(),
    }));
};

// ==========================================
// UPDATE REMINDER
// ==========================================

export const updateMaintenanceReminder = async (
    vehicleId,
    reminderId,
    reminderData
) => {
    const reminderRef = doc(
        db,
        "vehicles",
        vehicleId,
        "maintenanceReminders",
        reminderId
    );

    await updateDoc(reminderRef, {
        title: reminderData.title.trim(),
        reminderType: reminderData.reminderType,
        dueDate: reminderData.dueDate || "",
        dueKilometer:
            reminderData.dueKilometer === "" ||
            reminderData.dueKilometer === null ||
            reminderData.dueKilometer === undefined
                ? null
                : Number(reminderData.dueKilometer),
        currentKilometer:
            reminderData.currentKilometer === "" ||
            reminderData.currentKilometer === null ||
            reminderData.currentKilometer === undefined
                ? null
                : Number(reminderData.currentKilometer),
        notes: (reminderData.notes || "").trim(),
    });
};

// ==========================================
// MARK REMINDER COMPLETED
// ==========================================

export const completeMaintenanceReminder = async (
    vehicleId,
    reminderId
) => {
    const reminderRef = doc(
        db,
        "vehicles",
        vehicleId,
        "maintenanceReminders",
        reminderId
    );

    await updateDoc(reminderRef, {
        completed: true,
        completedAt: serverTimestamp(),
    });
};

// ==========================================
// DELETE REMINDER
// ==========================================

export const deleteMaintenanceReminder = async (
    vehicleId,
    reminderId
) => {
    const reminderRef = doc(
        db,
        "vehicles",
        vehicleId,
        "maintenanceReminders",
        reminderId
    );

    await deleteDoc(reminderRef);
};