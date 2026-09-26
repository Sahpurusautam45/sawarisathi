import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, X } from "lucide-react";
import {
    getUserNotifications,
    subscribeToUserNotifications,
    markUserNotificationAsRead,
} from "../services/userNotificationService";

function UserNotifications() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const unreadCount = notifications.filter(
        (notification) => !notification.read
    ).length;

    const loadNotifications = async () => {
        try {
            setLoading(true);

            const data = await getUserNotifications();

            setNotifications(data);
        } catch (error) {
            console.error(
                "Failed to load user notifications:",
                error
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const unsubscribe = subscribeToUserNotifications(
            (updatedNotifications) => {
                setNotifications(updatedNotifications);
            }
        );

        return () => {
            unsubscribe();
        };
    }, []);

    const handleNotificationClick = async (notification) => {
        try {
            // Mark notification as read
            if (!notification.read) {
                await markUserNotificationAsRead(
                    notification.id
                );

                setNotifications((current) =>
                    current.map((item) =>
                        item.id === notification.id
                            ? { ...item, read: true }
                            : item
                    )
                );
            }

            // ==========================================
            // VEHICLE EXPIRY NOTIFICATION NAVIGATION
            // ==========================================

            if (
                notification.type === "document_expiry" &&
                notification.vehicleId
            ) {
                const documentType =
                    (
                        notification.documentType || ""
                    ).toLowerCase();

                switch (documentType) {
                    case "bluebook":
                        navigate(
                            `/vehicle/${notification.vehicleId}/bluebook`
                        );
                        break;

                    case "insurance":
                        navigate(
                            `/vehicle/${notification.vehicleId}/insurance`
                        );
                        break;

                    case "tax":
                        navigate(
                            `/vehicle/${notification.vehicleId}/tax`
                        );
                        break;

                    default:
                        navigate(
                            `/vehicle/${notification.vehicleId}`
                        );
                }

                // Close notification panel
                setOpen(false);
            }

        } catch (error) {
            console.error(
                "Failed to handle notification:",
                error
            );
        }
    };

    return (
        <div className="relative">

            {/* ==================================
          BELL BUTTON
      ================================== */}

            <button
                type="button"
                onClick={() => setOpen((current) => !current)}
                className="relative p-2 rounded-full hover:bg-white/10 transition"
                aria-label="Notifications"
            >
                <Bell size={22} />

                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>


            {/* ==================================
          NOTIFICATION PANEL
      ================================== */}

            {open && (
                <div className="absolute right-0 top-12 w-96 max-w-[90vw] bg-white text-gray-800 rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-[100]">

                    {/* Header */}

                    <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">

                        <div>
                            <h3 className="font-bold">
                                Notifications
                            </h3>

                            <p className="text-xs text-gray-500">
                                {unreadCount} unread
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="p-1 rounded hover:bg-gray-200"
                        >
                            <X size={18} />
                        </button>

                    </div>


                    {/* Body */}

                    <div className="max-h-[420px] overflow-y-auto">

                        {loading ? (

                            <div className="p-6 text-center text-gray-500">
                                Loading notifications...
                            </div>

                        ) : notifications.length === 0 ? (

                            <div className="p-8 text-center">

                                <Bell
                                    size={32}
                                    className="mx-auto text-gray-300"
                                />

                                <p className="mt-3 text-sm text-gray-500">
                                    No notifications yet.
                                </p>

                            </div>

                        ) : (

                            notifications.map((notification) => (

                                <button
                                    type="button"
                                    key={notification.id}
                                    onClick={() =>
                                        handleNotificationClick(notification)
                                    }
                                    className={`w-full text-left px-4 py-4 border-b hover:bg-gray-50 transition ${notification.read
                                        ? "bg-white"
                                        : "bg-blue-50"
                                        }`}
                                >

                                    <div className="flex gap-3">

                                        <div className="mt-1">
                                            {notification.read ? (
                                                <Check
                                                    size={17}
                                                    className="text-green-600"
                                                />
                                            ) : (
                                                <Bell
                                                    size={17}
                                                    className="text-blue-600"
                                                />
                                            )}
                                        </div>

                                        <div className="flex-1">

                                            <p className="text-sm font-semibold text-gray-800">
                                                {notification.title}
                                            </p>

                                            {/* Vehicle Information */}
                                            {notification.vehicleName && (
                                                <p className="text-sm font-semibold text-blue-700 mt-1">
                                                    🚗 {notification.vehicleName}
                                                </p>
                                            )}

                                            {notification.vehicleNumber && (
                                                <p className="text-xs font-medium text-gray-600 mt-1">
                                                    Vehicle No: {notification.vehicleNumber}
                                                </p>
                                            )}

                                            <p className="text-xs text-gray-600 mt-2">
                                                {notification.message}
                                            </p>

                                            {notification.documentType && (
                                                <p className="text-[11px] text-gray-400 mt-2">
                                                    📄 {notification.documentType}
                                                </p>
                                            )}

                                        </div>

                                    </div>

                                </button>

                            ))

                        )}

                    </div>

                </div>
            )}

        </div>
    );
}

export default UserNotifications;