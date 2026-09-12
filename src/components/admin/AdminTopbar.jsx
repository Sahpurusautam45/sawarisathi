import { useEffect, useState } from "react";

import {
  Bell,
  Search,
  UserCircle,
  Check,
  X,
} from "lucide-react";

import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
} from "firebase/firestore";

import { db } from "../../firebase/firebase";

import { useNavigate } from "react-router-dom";


function AdminTopbar() {

  const navigate = useNavigate();


  // ==========================================
  // NOTIFICATIONS
  // ==========================================

  const [notifications, setNotifications] =
    useState([]);

  const [showNotifications, setShowNotifications] =
    useState(false);


  // ==========================================
  // LOAD ADMIN NOTIFICATIONS
  // ==========================================

  useEffect(() => {

    const notificationsRef =
      collection(
        db,
        "adminNotifications"
      );


    const notificationsQuery =
      query(
        notificationsRef,
        orderBy(
          "createdAt",
          "desc"
        )
      );


    const unsubscribe =
      onSnapshot(
        notificationsQuery,

        (snapshot) => {

          const notificationList =
            snapshot.docs.map(
              (notificationDoc) => ({

                id:
                  notificationDoc.id,

                ...notificationDoc.data(),

              })
            );


          setNotifications(
            notificationList
          );

        },

        (error) => {

          console.error(
            "Notification loading error:",
            error
          );

        }
      );


    return () =>
      unsubscribe();

  }, []);


  // ==========================================
  // UNREAD COUNT
  // ==========================================

  const unreadCount =
    notifications.filter(
      (notification) =>
        notification.read === false
    ).length;


  // ==========================================
  // MARK AS READ
  // ==========================================

  const markAsRead =
    async (notificationId) => {

      try {

        await updateDoc(
          doc(
            db,
            "adminNotifications",
            notificationId
          ),

          {
            read: true,
          }
        );

      } catch (error) {

        console.error(
          "Failed to mark notification as read:",
          error
        );

      }

    };


  // ==========================================
  // REVIEW VEHICLE
  // ==========================================

  const handleReview = async (notification) => {
    try {

      // Mark notification as read
      await markAsRead(notification.id);

      // Close notification dropdown
      setShowNotifications(false);

      // ==========================================
      // DOCUMENT TYPE
      // ==========================================

      const documentType =
        (notification.documentType || "").toLowerCase();

      // ==========================================
      // GO DIRECTLY TO THIS VEHICLE + DOCUMENT
      // ==========================================

      navigate(
        `/admin/vehicle-review/${notification.vehicleId}?document=${documentType}`
      );

    } catch (error) {

      console.error(
        "Review navigation error:",
        error
      );

    }
  };


  // ==========================================
  // NOTIFICATION ICON
  // ==========================================

  const getNotificationIcon =
    (documentType) => {

      if (
        documentType ===
        "Bluebook"
      ) {

        return "📘";

      }

      if (
        documentType ===
        "Insurance"
      ) {

        return "🛡️";

      }

      if (
        documentType ===
        "Tax"
      ) {

        return "💰";

      }

      return "📄";

    };


  // ==========================================
  // FORMAT TIME
  // ==========================================

  const formatTime =
    (timestamp) => {

      if (!timestamp) {
        return "Just now";
      }


      try {

        const date =
          timestamp.toDate();


        return date.toLocaleString();

      } catch {

        return "Just now";

      }

    };


  // ==========================================
  // CLOSE DROPDOWN WHEN CLICKING X
  // ==========================================

  const closeNotifications =
    () => {

      setShowNotifications(
        false
      );

    };


  return (

    <div className="relative">

      {/* =====================================
          TOPBAR
      ====================================== */}

      <div className="bg-white rounded-2xl shadow-md p-5 flex items-center justify-between">

        {/* ===================================
            LEFT
        ==================================== */}

        <div>

          <h2 className="text-2xl font-bold">
            👨‍💼 Admin Dashboard
          </h2>

          <p className="text-gray-500 text-sm">
            Welcome to the SawariSathi Control Center
          </p>

        </div>


        {/* ===================================
            RIGHT
        ==================================== */}

        <div className="flex items-center gap-4">


          {/* =================================
              NOTIFICATION
          ================================== */}

          <button

            type="button"

            onClick={() =>
              setShowNotifications(
                (previous) =>
                  !previous
              )
            }

            className="relative p-2 rounded-lg hover:bg-gray-100 transition"

          >

            <Bell size={22} />

            {/* UNREAD BADGE */}

            {unreadCount > 0 && (

              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">

                {unreadCount > 99
                  ? "99+"
                  : unreadCount}

              </span>

            )}

          </button>


          {/* =================================
              SEARCH
          ================================== */}

          <button

            type="button"

            className="p-2 rounded-lg hover:bg-gray-100"

          >

            <Search size={22} />

          </button>


          {/* =================================
              ADMIN
          ================================== */}

          <div className="flex items-center gap-2">

            <UserCircle size={34} />

            <div>

              <p className="font-semibold">
                Admin
              </p>

              <p className="text-sm text-gray-500">
                SawariSathi
              </p>

            </div>

          </div>

        </div>

      </div>


      {/* =====================================
          NOTIFICATION DROPDOWN
      ====================================== */}

      {showNotifications && (

        <div className="absolute right-0 top-[85px] w-[420px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border z-50 overflow-hidden">


          {/* =================================
              HEADER
          ================================== */}

          <div className="flex items-center justify-between p-4 border-b">

            <div>

              <h3 className="font-bold text-lg">
                🔔 Notifications
              </h3>

              <p className="text-xs text-gray-500">

                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                  : "All caught up"}

              </p>

            </div>


            <button

              type="button"

              onClick={
                closeNotifications
              }

              className="p-2 rounded-lg hover:bg-gray-100"

            >

              <X size={18} />

            </button>

          </div>


          {/* =================================
              NOTIFICATION LIST
          ================================== */}

          <div className="max-h-[500px] overflow-y-auto">


            {notifications.length === 0 ? (

              <div className="p-8 text-center">

                <div className="text-4xl">
                  🔕
                </div>

                <p className="font-semibold mt-3">
                  No notifications
                </p>

                <p className="text-sm text-gray-500 mt-1">
                  New document resubmissions will appear here.
                </p>

              </div>

            ) : (

              notifications.map(
                (notification) => (

                  <div

                    key={
                      notification.id
                    }

                    className={`p-4 border-b hover:bg-slate-50 transition ${notification.read
                        ? "bg-white"
                        : "bg-blue-50"
                      }`}

                  >

                    {/* =================================
                        NOTIFICATION CONTENT
                    ================================== */}

                    <div className="flex gap-3">

                      <div className="text-2xl">

                        {getNotificationIcon(
                          notification.documentType
                        )}

                      </div>


                      <div className="flex-1 min-w-0">

                        <div className="flex items-start justify-between gap-2">

                          <p className="font-semibold">

                            {notification.title ||
                              "Document Resubmitted"}

                          </p>


                          {!notification.read && (

                            <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />

                          )}

                        </div>


                        <p className="text-sm text-gray-600 mt-1">

                          {notification.message ||
                            `${notification.documentType} has been resubmitted for verification.`}

                        </p>


                        {notification.vehicleNumber && (

                          <p className="text-sm font-semibold text-gray-800 mt-2">

                            🚗{" "}
                            {notification.vehicleNumber}

                          </p>

                        )}


                        {notification.ownerName && (

                          <p className="text-xs text-gray-500 mt-1">

                            Owner:{" "}
                            {notification.ownerName}

                          </p>

                        )}


                        <p className="text-xs text-gray-400 mt-2">

                          {formatTime(
                            notification.createdAt
                          )}

                        </p>


                        {/* =================================
                            ACTIONS
                        ================================== */}

                        <div className="flex gap-2 mt-3">


                          <button

                            type="button"

                            onClick={() =>
                              handleReview(
                                notification
                              )
                            }

                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 rounded-lg transition"

                          >

                            Review

                          </button>


                          {!notification.read && (

                            <button

                              type="button"

                              onClick={() =>
                                markAsRead(
                                  notification.id
                                )
                              }

                              className="px-3 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg"

                              title="Mark as read"

                            >

                              <Check size={18} />

                            </button>

                          )}

                        </div>

                      </div>

                    </div>

                  </div>

                )

              )

            )}

          </div>

        </div>

      )}

    </div>

  );

}


export default AdminTopbar;