import { auth, db } from "../firebase/firebase";

import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    getDoc,
    updateDoc,
    doc,
    deleteDoc,
    setDoc,
    runTransaction,
    serverTimestamp,
    onSnapshot,
} from "firebase/firestore";

// ==========================================
// CREATE USER NOTIFICATION
// ==========================================

export const createUserNotification = async ({
    title,
    message,
    type,
    vehicleId = "",
    documentType = "",
}) => {

    const user = auth.currentUser;

    if (!user) {
        throw new Error("User not logged in.");
    }

    const notificationsRef =
        collection(db, "userNotifications");

    await addDoc(
        notificationsRef,
        {
            userId: user.uid,

            title,
            message,

            type,

            vehicleId,

            documentType,

            read: false,

            createdAt:
                serverTimestamp(),
        }
    );
};


// ==========================================
// MAINTENANCE NOTIFICATION HELPERS
// ==========================================

// Generate a consistent notification ID.
// One reminder can have only one notification
// for each status and user.

const getMaintenanceNotificationId = ({
    userId,
    vehicleId,
    reminderId,
    status,
}) => {
    return encodeURIComponent(
        `${userId}_${vehicleId}_${reminderId}_${status}`
    );
};


// ==========================================
// CREATE MAINTENANCE NOTIFICATION ONCE
// ==========================================

export const createMaintenanceNotificationOnce = async ({
    vehicleId,
    vehicleName,
    vehicleNumber,
    reminderId,
    reminderTitle,
    status,
    message,
}) => {
    const user = auth.currentUser;

    if (!user) {
        throw new Error("User not logged in.");
    }

    if (
        !vehicleId ||
        !reminderId ||
        !reminderTitle ||
        !["dueSoon", "overdue"].includes(status)
    ) {
        throw new Error(
            "Maintenance notification information is incomplete."
        );
    }

    const notificationId = getMaintenanceNotificationId({
        userId: user.uid,
        vehicleId,
        reminderId,
        status,
    });

    const notificationRef = doc(
        db,
        "userNotifications",
        notificationId
    );

    // Remove the previous status notification.
    const previousStatus =
        status === "overdue" ? "dueSoon" : "overdue";

    const previousNotificationId =
        getMaintenanceNotificationId({
            userId: user.uid,
            vehicleId,
            reminderId,
            status: previousStatus,
        });

    await deleteDoc(
        doc(
            db,
            "userNotifications",
            previousNotificationId
        )
    ).catch((error) => {
        console.warn(
            "Could not remove previous maintenance notification:",
            error
        );
    });

    // Transaction prevents duplicate creation and
    // preserves an existing notification's read state.
    const result = await runTransaction(db, async (transaction) => {
        const existing = await transaction.get(notificationRef);

        if (existing.exists()) {
            return {
                created: false,
                id: notificationId,
            };
        }

        transaction.set(notificationRef, {
            userId: user.uid,
            vehicleId,
            vehicleName: vehicleName || "Vehicle",
            vehicleNumber: vehicleNumber || "Unknown",

            reminderId,
            reminderTitle,

            title:
                status === "overdue"
                    ? "Maintenance Overdue"
                    : "Maintenance Due Soon",

            message,
            status,
            type: "maintenance",

            read: false,
            createdAt: serverTimestamp(),
        });

        return {
            created: true,
            id: notificationId,
        };
    });

    console.log(
        result.created
            ? "Maintenance notification created:"
            : "Maintenance notification already exists:",
        result.id
    );

    return result;
};


// ==========================================
// RESOLVE MAINTENANCE NOTIFICATIONS
// ==========================================

export const resolveMaintenanceNotifications = async ({
    vehicleId,
    reminderId,
}) => {
    const user = auth.currentUser;

    if (!user) {
        throw new Error("User not logged in.");
    }

    if (!vehicleId || !reminderId) {
        return {
            resolved: false,
        };
    }

    const statuses = ["dueSoon", "overdue"];

    let resolvedCount = 0;

    for (const status of statuses) {
        const notificationId = getMaintenanceNotificationId({
            userId: user.uid,
            vehicleId,
            reminderId,
            status,
        });

        const notificationRef = doc(
            db,
            "userNotifications",
            notificationId
        );

        const snapshot = await getDoc(notificationRef);

        if (snapshot.exists()) {
            await deleteDoc(notificationRef);
            resolvedCount++;
        }
    }

    console.log(
        "Maintenance notifications resolved:",
        resolvedCount
    );

    return {
        resolved: resolvedCount > 0,
        count: resolvedCount,
    };
};

// ==========================================
// GET USER NOTIFICATIONS
// ==========================================

export const getUserNotifications = async () => {

    const user = auth.currentUser;

    if (!user) {
        throw new Error("User not logged in.");
    }

    const notificationsRef =
        collection(db, "userNotifications");

    const q = query(
        notificationsRef,
        where("userId", "==", user.uid)
    );

    const snapshot = await getDocs(q);

    const notifications = snapshot.docs.map(
        (notificationDoc) => ({
            id: notificationDoc.id,
            ...notificationDoc.data(),
        })
    );

    // Newest first
    notifications.sort((a, b) => {

        const timeA =
            a.createdAt?.toMillis?.() || 0;

        const timeB =
            b.createdAt?.toMillis?.() || 0;

        return timeB - timeA;
    });

    return notifications;
};


// ==========================================
// REAL-TIME USER NOTIFICATIONS
// ==========================================

export const subscribeToUserNotifications = (callback) => {
    const user = auth.currentUser;

    if (!user) {
        console.warn(
            "⚠️ Cannot subscribe: user not logged in."
        );
        return () => { };
    }

    const notificationsRef =
        collection(db, "userNotifications");

    const q = query(
        notificationsRef,
        where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
            const notifications =
                snapshot.docs.map(
                    (notificationDoc) => ({
                        id: notificationDoc.id,
                        ...notificationDoc.data(),
                    })
                );

            // Newest first
            notifications.sort((a, b) => {
                const timeA =
                    a.createdAt?.toMillis?.() || 0;

                const timeB =
                    b.createdAt?.toMillis?.() || 0;

                return timeB - timeA;
            });

            callback(notifications);
        },
        (error) => {
            console.error(
                "❌ User notification listener error:",
                error
            );
        }
    );

    return unsubscribe;
};

// ==========================================
// MARK NOTIFICATION AS READ
// ==========================================

export const markUserNotificationAsRead =
    async (notificationId) => {

        if (!notificationId) {
            return;
        }

        const notificationRef =
            doc(
                db,
                "userNotifications",
                notificationId
            );

        await updateDoc(
            notificationRef,
            {
                read: true,
            }
        );
    };


// ==========================================
// FIND VEHICLE EXPIRY NOTIFICATIONS
// ==========================================

const findVehicleExpiryNotifications = async ({
    userId,
    vehicleId,
    documentType,
}) => {

    const notificationsRef =
        collection(db, "userNotifications");

    const q = query(
        notificationsRef,
        where("userId", "==", userId)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.filter((notificationDoc) => {

        const data =
            notificationDoc.data();

        return (
            data.type === "document_expiry" &&
            data.vehicleId === vehicleId &&
            data.documentType === documentType
        );

    });
};


// ==========================================
// CREATE / UPDATE VEHICLE EXPIRY NOTIFICATION
// ==========================================

export const createExpiryNotificationOnce = async ({
    vehicleId,
    vehicleName,
    vehicleNumber,
    documentType,
    status,
    message,
}) => {

    const user = auth.currentUser;

    if (!user) {
        throw new Error("User not logged in.");
    }

    if (
        !vehicleId ||
        !vehicleName ||
        !vehicleNumber ||
        !documentType ||
        !status ||
        !message
    ) {
        throw new Error(
            "Vehicle and notification information is incomplete."
        );
    }

    // ==========================================
    // FIND EXISTING EXPIRY NOTIFICATIONS
    // ==========================================

    const existingNotifications =
        await findVehicleExpiryNotifications({
            userId: user.uid,
            vehicleId,
            documentType,
        });


    // ==========================================
    // SAME STATUS ALREADY EXISTS
    // ==========================================

    const sameStatus =
        existingNotifications.find(
            (notificationDoc) =>
                notificationDoc.data().status === status
        );

    if (sameStatus) {

        console.log(
            "🔁 Expiry notification already exists:",
            {
                vehicleId,
                documentType,
                status,
                id: sameStatus.id,
            }
        );

        return {
            created: false,
            updated: false,
            resolved: false,
            id: sameStatus.id,
        };
    }


    // ==========================================
    // REMOVE OLD EXPIRY NOTIFICATIONS
    // ==========================================

    for (
        const notificationDoc
        of existingNotifications
    ) {

        await deleteDoc(
            notificationDoc.ref
        );

        console.log(
            "🗑️ Removed old expiry notification:",
            notificationDoc.id
        );
    }


    // ==========================================
    // DETERMINISTIC NOTIFICATION ID
    // ==========================================
    // Same vehicle + document + status
    // will always use the same Firestore ID.
    //
    // This prevents duplicate notifications
    // if the expiry check runs more than once.
    // ==========================================

    const notificationId =
        encodeURIComponent(
            `${user.uid}_${vehicleId}_${documentType}_${status}`
        );


    const notificationRef =
        doc(
            db,
            "userNotifications",
            notificationId
        );


    // ==========================================
    // CREATE / UPDATE CURRENT NOTIFICATION
    // ==========================================

    await setDoc(
        notificationRef,
        {
            userId: user.uid,

            vehicleId,

            vehicleName,

            vehicleNumber,

            documentType,

            status,

            title:
                `${documentType} Expiry Alert`,

            message,

            type:
                "document_expiry",

            read: false,

            createdAt:
                serverTimestamp(),
        }
    );


    console.log(
        "✅ Vehicle expiry notification created:",
        notificationId
    );


    return {
        created: true,

        updated:
            existingNotifications.length > 0,

        resolved: false,

        id: notificationId,
    };
};


// ==========================================
// RESOLVE VEHICLE EXPIRY NOTIFICATION
// ==========================================

export const resolveExpiryNotification = async ({
    vehicleId,
    documentType,
}) => {

    const user = auth.currentUser;

    if (!user) {
        throw new Error("User not logged in.");
    }

    if (!vehicleId || !documentType) {
        return;
    }

    const existingNotifications =
        await findVehicleExpiryNotifications({
            userId: user.uid,
            vehicleId,
            documentType,
        });


    if (existingNotifications.length === 0) {

        console.log(
            "ℹ️ No expiry notification to resolve:",
            {
                vehicleId,
                documentType,
            }
        );

        return {
            resolved: false,
        };
    }


    for (
        const notificationDoc
        of existingNotifications
    ) {

        await deleteDoc(
            notificationDoc.ref
        );

        console.log(
            "♻️ Expiry notification resolved:",
            notificationDoc.id
        );
    }


    return {
        resolved: true,
        count:
            existingNotifications.length,
    };
};

// ==========================================
// CREATE NOTIFICATION FOR SPECIFIC USER
// Used by Admin after document approval
// ==========================================

export const createUserNotificationForUser = async ({
    userId,
    title,
    message,
    type,
    vehicleId = "",
    documentType = "",
}) => {
    if (!userId) {
        throw new Error(
            "User ID is required to create notification."
        );
    }

    const notificationsRef =
        collection(db, "userNotifications");

    await addDoc(
        notificationsRef,
        {
            userId,

            title,
            message,
            type,

            vehicleId,
            documentType,

            read: false,

            createdAt:
                serverTimestamp(),
        }
    );
};