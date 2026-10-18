import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/firebase";

// ==========================================
// GET VEHICLE EXPENSE COLLECTION
// ==========================================

const getExpenseCollection = (vehicleId) => {
    return collection(
        db,
        "vehicles",
        vehicleId,
        "fuelExpenses"
    );
};

// ==========================================
// ADD FUEL OR OTHER EXPENSE
// ==========================================

export const addExpense = async (vehicleId, expenseData) => {
    const expenseCollection = getExpenseCollection(vehicleId);

    const docRef = await addDoc(expenseCollection, {
        ...expenseData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });

    return docRef.id;
};

// ==========================================
// GET ALL VEHICLE EXPENSES
// ==========================================

export const getExpenses = async (vehicleId) => {
    const expenseCollection = getExpenseCollection(vehicleId);

    const expenseQuery = query(
        expenseCollection,
        orderBy("expenseDate", "desc")
    );

    const snapshot = await getDocs(expenseQuery);

    return snapshot.docs.map((expenseDoc) => ({
        id: expenseDoc.id,
        ...expenseDoc.data(),
    }));
};

// ==========================================
// UPDATE EXPENSE
// ==========================================

export const updateExpense = async (
    vehicleId,
    expenseId,
    expenseData
) => {
    const expenseRef = doc(
        db,
        "vehicles",
        vehicleId,
        "fuelExpenses",
        expenseId
    );

    await updateDoc(expenseRef, {
        ...expenseData,
        updatedAt: serverTimestamp(),
    });
};

// ==========================================
// DELETE EXPENSE
// ==========================================

export const deleteExpense = async (vehicleId, expenseId) => {
    const expenseRef = doc(
        db,
        "vehicles",
        vehicleId,
        "fuelExpenses",
        expenseId
    );

    await deleteDoc(expenseRef);
};

// ==========================================
// GET SINGLE EXPENSE
// ==========================================

export const getExpenseById = async (vehicleId, expenseId) => {
    const expenseRef = doc(
        db,
        "vehicles",
        vehicleId,
        "fuelExpenses",
        expenseId
    );

    const snapshot = await getDoc(expenseRef);

    if (!snapshot.exists()) {
        return null;
    }

    return {
        id: snapshot.id,
        ...snapshot.data(),
    };
};