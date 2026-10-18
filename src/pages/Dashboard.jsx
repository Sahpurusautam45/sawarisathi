import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";

import { getBluebook } from "../services/bluebookService";
import { getInsurance } from "../services/insuranceService";
import { getTax } from "../services/taxService";
import { getVehicles } from "../services/vehicleService";
import { getMaintenanceReminders } from "../services/maintenanceReminderService";

import { useLanguage } from "../context/LanguageContext";
import { getVehicleAlerts } from "../utils/vehicleAlerts";

import {
  createExpiryNotificationOnce,
  resolveExpiryNotification,
  createMaintenanceNotificationOnce,
  resolveMaintenanceNotifications,
} from "../services/userNotificationService";

// ======================================================
// HELPER: CALCULATE MAINTENANCE ALERTS
// ======================================================

function calculateMaintenanceAlerts(reminders = []) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return reminders
    .filter((reminder) => reminder.completed !== true)
    .map((reminder) => {
      let daysRemaining = null;

      if (reminder.dueDate) {
        const dueDate = new Date(`${reminder.dueDate}T00:00:00`);

        if (!Number.isNaN(dueDate.getTime())) {
          daysRemaining = Math.ceil(
            (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );
        }
      }

      const hasCurrentKM =
        reminder.currentKilometer !== null &&
        reminder.currentKilometer !== undefined &&
        reminder.currentKilometer !== "" &&
        Number.isFinite(Number(reminder.currentKilometer));

      const hasDueKM =
        reminder.dueKilometer !== null &&
        reminder.dueKilometer !== undefined &&
        reminder.dueKilometer !== "" &&
        Number.isFinite(Number(reminder.dueKilometer));

      const currentKM = Number(reminder.currentKilometer);
      const dueKM = Number(reminder.dueKilometer);

      const kilometerOverdue =
        hasCurrentKM && hasDueKM && currentKM >= dueKM;

      const kilometerDueSoon =
        hasCurrentKM &&
        hasDueKM &&
        currentKM < dueKM &&
        dueKM - currentKM <= 500;

      let alertStatus = "upcoming";

      if (
        (daysRemaining !== null && daysRemaining < 0) ||
        kilometerOverdue
      ) {
        alertStatus = "overdue";
      } else if (
        (daysRemaining !== null && daysRemaining <= 7) ||
        kilometerDueSoon
      ) {
        alertStatus = "dueSoon";
      }

      return {
        ...reminder,
        alertStatus,
        daysRemaining,
      };
    })
    .filter((reminder) => reminder.alertStatus !== "upcoming");
}

// ======================================================
// HELPER: CALCULATE VEHICLE HEALTH SCORE
// ======================================================

function calculateVehicleHealth(vehicle, alerts = [], maintenanceAlerts = []) {
  const scores = [];
  const documentTypes = ["Bluebook", "Insurance", "Tax"];

  // Score each document only when its status is known.
  documentTypes.forEach((documentType) => {
    const alert = alerts.find(
      (item) => item.documentType === documentType
    );

    if (!alert || alert.status === "unknown") return;

    switch (alert.status) {
      case "expired":
        scores.push(0);
        break;
      case "today":
        scores.push(50);
        break;
      case "warning":
        scores.push(70);
        break;
      case "valid":
        scores.push(100);
        break;
      default:
        // Missing, no-expiry, and unsupported statuses are not scored.
        break;
    }
  });

  // Score active maintenance alerts.
  maintenanceAlerts.forEach((reminder) => {
    if (reminder.alertStatus === "overdue") {
      scores.push(0);
    } else if (reminder.alertStatus === "dueSoon") {
      scores.push(50);
    } else {
      scores.push(100);
    }
  });

  const knownItems = scores.length;
  const totalItems = documentTypes.length + maintenanceAlerts.length;

  if (knownItems === 0) {
    return {
      score: null,
      label: "Insufficient Data",
      color: "slate",
      knownItems: 0,
      totalItems,
    };
  }

  const score = Math.round(
    scores.reduce((total, value) => total + value, 0) / knownItems
  );

  let label;
  let color;

  if (score >= 80) {
    label = "Good";
    color = "green";
  } else if (score >= 60) {
    label = "Needs Attention";
    color = "yellow";
  } else if (score >= 40) {
    label = "Poor";
    color = "orange";
  } else {
    label = "Critical";
    color = "red";
  }

  return {
    score,
    label,
    color,
    knownItems,
    totalItems,
  };
}

// ======================================================
// DASHBOARD COMPONENT
// ======================================================

function Dashboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [fullName, setFullName] = useState("User");
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedHealth, setExpandedHealth] = useState({});
  const [vehicleFilter, setVehicleFilter] = useState("all");
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [vehicleSort, setVehicleSort] = useState("recent");

  // ====================================================
  // DOCUMENT EXPIRY NOTIFICATIONS
  // ====================================================

  const createVehicleExpiryNotifications = async (vehicleList) => {
    try {
      console.log("Checking vehicle expiry notifications...");

      for (const vehicle of vehicleList) {
        const alerts = getVehicleAlerts(vehicle);

        for (const alert of alerts) {
          const needsNotification = [
            "warning",
            "today",
            "expired",
          ].includes(alert.status);

          if (!needsNotification) {
            try {
              await resolveExpiryNotification({
                vehicleId: vehicle.id,
                documentType: alert.documentType,
              });
            } catch (error) {
              console.error(
                "Could not resolve expiry notification:",
                error
              );
            }

            continue;
          }

          try {
            await createExpiryNotificationOnce({
              vehicleId: vehicle.id,

              vehicleName:
                `${vehicle.brand || ""} ${vehicle.model || ""}`.trim() ||
                "Vehicle",

              vehicleNumber: vehicle.vehicleNumber || "Unknown",

              documentType: alert.documentType,
              status: alert.status,
              message: alert.message,
            });
          } catch (error) {
            console.error(
              "Could not create expiry notification:",
              error
            );
          }
        }
      }

      console.log("Expiry notification check completed.");
    } catch (error) {
      console.error("Expiry notification system error:", error);
    }
  };

  // ==========================================
  // MAINTENANCE NOTIFICATION SYSTEM
  // ==========================================

  const createVehicleMaintenanceNotifications = async (vehicleList) => {
    try {
      console.log("🔧 Checking maintenance notifications...");

      for (const vehicle of vehicleList) {
        const reminders = vehicle.maintenanceReminders || [];

        for (const reminder of reminders) {
          // Resolve notifications for completed reminders.
          if (reminder.completed === true) {
            try {
              await resolveMaintenanceNotifications({
                vehicleId: vehicle.id,
                reminderId: reminder.id,
              });
            } catch (error) {
              console.error(
                "Could not resolve completed maintenance notification:",
                error
              );
            }

            continue;
          }

          // Calculate the reminder's current alert status.
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          let daysRemaining = null;

          if (reminder.dueDate) {
            const dueDate = new Date(`${reminder.dueDate}T00:00:00`);

            if (!Number.isNaN(dueDate.getTime())) {
              daysRemaining = Math.ceil(
                (dueDate.getTime() - today.getTime()) /
                (1000 * 60 * 60 * 24)
              );
            }
          }

          const hasCurrentKM =
            reminder.currentKilometer !== null &&
            reminder.currentKilometer !== undefined &&
            reminder.currentKilometer !== "" &&
            Number.isFinite(Number(reminder.currentKilometer));

          const hasDueKM =
            reminder.dueKilometer !== null &&
            reminder.dueKilometer !== undefined &&
            reminder.dueKilometer !== "" &&
            Number.isFinite(Number(reminder.dueKilometer));

          const currentKM = Number(reminder.currentKilometer);
          const dueKM = Number(reminder.dueKilometer);

          const kilometerOverdue =
            hasCurrentKM && hasDueKM && currentKM >= dueKM;

          const kilometerDueSoon =
            hasCurrentKM &&
            hasDueKM &&
            currentKM < dueKM &&
            dueKM - currentKM <= 500;

          let status = "upcoming";

          if (
            (daysRemaining !== null && daysRemaining < 0) ||
            kilometerOverdue
          ) {
            status = "overdue";
          } else if (
            (daysRemaining !== null && daysRemaining <= 7) ||
            kilometerDueSoon
          ) {
            status = "dueSoon";
          }

          // No active alert? Remove any previous notifications.
          if (status === "upcoming") {
            try {
              await resolveMaintenanceNotifications({
                vehicleId: vehicle.id,
                reminderId: reminder.id,
              });
            } catch (error) {
              console.error(
                "Could not resolve maintenance notification:",
                error
              );
            }

            continue;
          }

          const reminderTitle =
            reminder.title ||
            reminder.reminderType ||
            "Maintenance";

          const message =
            status === "overdue"
              ? `${reminderTitle} is overdue. Please schedule maintenance.`
              : `${reminderTitle} is due soon. Please plan maintenance.`;

          try {
            await createMaintenanceNotificationOnce({
              vehicleId: vehicle.id,

              vehicleName:
                `${vehicle.brand || ""} ${vehicle.model || ""}`.trim() ||
                "Vehicle",

              vehicleNumber: vehicle.vehicleNumber || "Unknown",

              reminderId: reminder.id,
              reminderTitle,
              status,
              message,
            });
          } catch (error) {
            console.error(
              "Could not create maintenance notification:",
              {
                vehicleId: vehicle.id,
                reminderId: reminder.id,
                status,
              },
              error
            );
          }
        }
      }

      console.log("✅ Maintenance notification check completed.");
    } catch (error) {
      console.error("Maintenance notification system error:", error);
    }
  };

  // ====================================================
  // FETCH DASHBOARD DATA
  // ====================================================

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      try {
        const user = auth.currentUser;

        if (!user) {
          return;
        }

        // Get user profile
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists() && isMounted) {
            const userData = userSnap.data();
            setFullName(userData.fullName || "User");
          }
        } catch (error) {
          console.error("Could not load user profile:", error);
        }

        // Get user's vehicles
        const vehicleList = await getVehicles();

        if (!isMounted) return;

        // Load document details and maintenance reminders separately.
        // A reminder-loading failure will not remove the vehicle.
        const vehiclesWithDocuments = await Promise.all(
          vehicleList.map(async (vehicle) => {
            const [
              bluebookResult,
              insuranceResult,
              taxResult,
              maintenanceResult,
            ] = await Promise.allSettled([
              getBluebook(vehicle.id),
              getInsurance(vehicle.id),
              getTax(vehicle.id),
              getMaintenanceReminders(vehicle.id),
            ]);

            const bluebook =
              bluebookResult.status === "fulfilled"
                ? bluebookResult.value
                : null;

            const insurance =
              insuranceResult.status === "fulfilled"
                ? insuranceResult.value
                : null;

            const tax =
              taxResult.status === "fulfilled"
                ? taxResult.value
                : null;

            const maintenanceReminders =
              maintenanceResult.status === "fulfilled"
                ? maintenanceResult.value || []
                : [];

            if (maintenanceResult.status === "rejected") {
              console.error(
                "Could not load maintenance reminders for:",
                vehicle.id,
                maintenanceResult.reason
              );
            }

            return {
              ...vehicle,

              bluebookExpiry: bluebook?.expiryDate || null,
              insuranceExpiry: insurance?.validUntil || null,
              taxExpiry: tax?.paidUntil || null,

              maintenanceReminders,
            };
          })
        );

        if (!isMounted) return;

        setVehicles(vehiclesWithDocuments);

        // Keep existing document expiry notifications.
        await createVehicleExpiryNotifications(vehiclesWithDocuments);

        // Create and resolve maintenance notifications.
        await createVehicleMaintenanceNotifications(vehiclesWithDocuments);
      } catch (error) {
        console.error("Dashboard Error:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  // ====================================================
  // HANDLE DOCUMENT ALERT CLICK
  // ====================================================

  const handleAlertClick = (vehicleId, documentType) => {
    if (!vehicleId) {
      console.error("Vehicle ID is missing.");
      return;
    }

    switch (documentType) {
      case "Bluebook":
        navigate(`/vehicle/${vehicleId}/bluebook`);
        break;

      case "Insurance":
        navigate(`/vehicle/${vehicleId}/insurance`);
        break;

      case "Tax":
        navigate(`/vehicle/${vehicleId}/tax`);
        break;

      default:
        console.warn("Unknown document type:", documentType);
    }
  };

  // ====================================================
  // LOADING SCREEN
  // ====================================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto" />

          <p className="text-gray-500 mt-4">
            {t("loadingVehicles")}
          </p>
        </div>
      </div>
    );
  }

  // ====================================================
  // VEHICLE HEALTH SUMMARY
  // ====================================================

  const dashboardSummary = vehicles.reduce(
    (summary, vehicle) => {
      const documentAlerts = getVehicleAlerts(vehicle);

      const maintenanceAlerts = calculateMaintenanceAlerts(
        vehicle.maintenanceReminders || []
      );

      const hasDocumentIssue = documentAlerts.some((alert) =>
        ["expired", "today", "warning"].includes(alert.status)
      );

      const hasMaintenanceIssue = maintenanceAlerts.length > 0;

      const expiredDocuments = documentAlerts.filter(
        (alert) => alert.status === "expired"
      ).length;

      const overdueMaintenance = maintenanceAlerts.filter(
        (reminder) => reminder.alertStatus === "overdue"
      ).length;

      summary.totalVehicles += 1;
      summary.expiredDocuments += expiredDocuments;
      summary.overdueMaintenance += overdueMaintenance;

      if (hasDocumentIssue || hasMaintenanceIssue) {
        summary.needsAttention += 1;
      } else {
        summary.noUrgentAlerts += 1;
      }

      return summary;
    },
    {
      totalVehicles: 0,
      noUrgentAlerts: 0,
      needsAttention: 0,
      expiredDocuments: 0,
      overdueMaintenance: 0,
    }
  );

  // ====================================================
  // FLEET HEALTH ANALYTICS
  // ====================================================

  const healthAnalytics = vehicles.reduce((summary, vehicle) => {
    const documentAlerts = getVehicleAlerts(vehicle);
    const maintenanceAlerts = calculateMaintenanceAlerts(
      vehicle.maintenanceReminders || []
    );
    const health = calculateVehicleHealth(vehicle, documentAlerts, maintenanceAlerts);

    summary.healthScores.push(health.score);
    summary.documents.expired += documentAlerts.filter((item) => item.status === "expired").length;
    summary.documents.expiringSoon += documentAlerts.filter((item) => ["today", "warning"].includes(item.status)).length;
    summary.documents.valid += documentAlerts.filter((item) => item.status === "valid").length;
    summary.maintenance.overdue += maintenanceAlerts.filter((item) => item.alertStatus === "overdue").length;
    summary.maintenance.dueSoon += maintenanceAlerts.filter((item) => item.alertStatus === "dueSoon").length;
    summary.maintenance.active += (vehicle.maintenanceReminders || []).filter((item) => item.completed !== true).length;

    if (health.score !== null) {
      summary.scoredVehicles += 1;
      summary.totalHealth += health.score;
      if (health.score >= 80) summary.healthBands.good += 1;
      else if (health.score >= 60) summary.healthBands.attention += 1;
      else if (health.score >= 40) summary.healthBands.poor += 1;
      else summary.healthBands.critical += 1;
    }
    return summary;
  }, {
    documents: { valid: 0, expiringSoon: 0, expired: 0 },
    maintenance: { active: 0, dueSoon: 0, overdue: 0 },
    healthBands: { good: 0, attention: 0, poor: 0, critical: 0 },
    healthScores: [], scoredVehicles: 0, totalHealth: 0,
  });

  const averageFleetHealth = healthAnalytics.scoredVehicles
    ? Math.round(healthAnalytics.totalHealth / healthAnalytics.scoredVehicles)
    : null;
  const analyticsTotal = healthAnalytics.healthBands.good + healthAnalytics.healthBands.attention + healthAnalytics.healthBands.poor + healthAnalytics.healthBands.critical;
  const analyticsPercent = (value) => analyticsTotal ? Math.round((value / analyticsTotal) * 100) : 0;

  const dashboardFilteredVehicles = vehicles.filter((vehicle) => {
    if (vehicleFilter === "all") {
      return true;
    }

    const documentAlerts = getVehicleAlerts(vehicle);
    const maintenanceAlerts = calculateMaintenanceAlerts(
      vehicle.maintenanceReminders || []
    );

    const hasDocumentIssue = documentAlerts.some((alert) =>
      ["expired", "today", "warning"].includes(alert.status)
    );
    const hasMaintenanceIssue = maintenanceAlerts.length > 0;

    if (vehicleFilter === "healthy") {
      return !hasDocumentIssue && !hasMaintenanceIssue;
    }
    if (vehicleFilter === "attention") {
      return hasDocumentIssue || hasMaintenanceIssue;
    }
    if (vehicleFilter === "expired") {
      return documentAlerts.some((alert) => alert.status === "expired");
    }
    if (vehicleFilter === "maintenance") {
      return maintenanceAlerts.some(
        (reminder) => reminder.alertStatus === "overdue"
      );
    }
    return true;
  });

  const normalizedSearch = vehicleSearch.trim().toLowerCase();

  const filteredVehicles = dashboardFilteredVehicles
    .filter((vehicle) => {
      if (!normalizedSearch) return true;
      const searchableValues = [
        vehicle.vehicleNumber,
        vehicle.registrationNumber,
        vehicle.brand,
        vehicle.model,
        vehicle.vehicleType,
        vehicle.color,
      ];
      return searchableValues.some((value) =>
        String(value || "").toLowerCase().includes(normalizedSearch)
      );
    })
    .sort((a, b) => {
      const nameA = `${a.brand || ""} ${a.model || ""}`.trim().toLowerCase();
      const nameB = `${b.brand || ""} ${b.model || ""}`.trim().toLowerCase();

      const getHealthScore = (vehicle) => {
        const alerts = getVehicleAlerts(vehicle);
        const maintenanceAlerts = calculateMaintenanceAlerts(
          vehicle.maintenanceReminders || []
        );
        return calculateVehicleHealth(vehicle, alerts, maintenanceAlerts).score;
      };

      const getCreatedTime = (vehicle) => {
        const rawDate =
          vehicle.createdAt ||
          vehicle.created_at ||
          vehicle.dateAdded ||
          vehicle.updatedAt;
        if (!rawDate) return 0;
        if (typeof rawDate.toDate === "function") return rawDate.toDate().getTime();
        const date = new Date(rawDate);
        return Number.isNaN(date.getTime()) ? 0 : date.getTime();
      };

      switch (vehicleSort) {
        case "name-asc":
          return nameA.localeCompare(nameB);
        case "name-desc":
          return nameB.localeCompare(nameA);
        case "health-high": {
          const scoreA = getHealthScore(a);
          const scoreB = getHealthScore(b);
          if (scoreA === null) return scoreB === null ? 0 : 1;
          if (scoreB === null) return -1;
          return scoreB - scoreA;
        }
        case "health-low": {
          const scoreA = getHealthScore(a);
          const scoreB = getHealthScore(b);
          if (scoreA === null) return scoreB === null ? 0 : 1;
          if (scoreB === null) return -1;
          return scoreA - scoreB;
        }
        case "recent":
        default:
          return getCreatedTime(b) - getCreatedTime(a);
      }
    });
  // ====================================================
  // DASHBOARD UI
  // ====================================================

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50">
      <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-5 sm:py-6 lg:px-6 lg:py-8">

        {/* WELCOME SECTION */}

        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {t("welcome")}, {fullName} 👋
          </h1>

          <p className="text-gray-500 mt-2">
            {t("manageYourVehicles")}
          </p>
        </div>

        {/* VEHICLE HEALTH SUMMARY */}

        <section className="mb-7 sm:mb-10">
          <div className="mb-5">
            <h2 className="text-xl font-bold tracking-tight text-slate-800">
              Vehicle Overview
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Your fleet status at a glance
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
            {/* TOTAL VEHICLES */}
            <button
              type="button"
              onClick={() => setVehicleFilter("all")}
              aria-pressed={vehicleFilter === "all"}
              className={`group w-full rounded-2xl border bg-gradient-to-br from-white to-blue-50 p-3 text-left shadow-sm transition-colors duration-200 hover:shadow-md sm:p-5 focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                vehicleFilter === "all" ? "border-blue-400 ring-2 ring-blue-100" : "border-blue-100"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-xl sm:h-11 sm:w-11 sm:rounded-xl sm:text-2xl">🚗</div>
                <span className="text-xs font-semibold text-blue-600">Fleet</span>
              </div>
              <p className="mt-3 text-xs font-medium leading-snug text-slate-500 sm:mt-4 sm:text-sm">Total Vehicles</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 sm:text-3xl">{dashboardSummary.totalVehicles}</p>
              <p className="mt-1 text-xs text-slate-500">Registered vehicles</p>
            </button>

            {/* NO URGENT ALERTS */}
            <button
              type="button"
              onClick={() => setVehicleFilter("healthy")}
              aria-pressed={vehicleFilter === "healthy"}
              className={`group w-full rounded-2xl border bg-gradient-to-br from-white to-emerald-50 p-3 text-left shadow-sm transition-colors duration-200 hover:shadow-md sm:p-5 focus:outline-none focus:ring-2 focus:ring-emerald-300 ${
                vehicleFilter === "healthy" ? "border-emerald-400 ring-2 ring-emerald-100" : "border-emerald-100"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-xl sm:h-11 sm:w-11 sm:rounded-xl sm:text-2xl">🟢</div>
                <span className="text-xs font-semibold text-emerald-700">Clear</span>
              </div>
              <p className="mt-3 text-xs font-medium leading-snug text-slate-500 sm:mt-4 sm:text-sm">No Urgent Alerts</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-700 sm:text-3xl">{dashboardSummary.noUrgentAlerts}</p>
              <p className="mt-1 text-xs text-slate-500">No current alerts detected</p>
            </button>

            {/* NEEDS ATTENTION */}
            <button
              type="button"
              onClick={() => setVehicleFilter("attention")}
              aria-pressed={vehicleFilter === "attention"}
              className={`group w-full rounded-2xl border bg-gradient-to-br from-white to-amber-50 p-3 text-left shadow-sm transition-colors duration-200 hover:shadow-md sm:p-5 focus:outline-none focus:ring-2 focus:ring-amber-300 ${
                vehicleFilter === "attention" ? "border-amber-400 ring-2 ring-amber-100" : "border-amber-100"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-xl sm:h-11 sm:w-11 sm:rounded-xl sm:text-2xl">⚠️</div>
                <span className="text-xs font-semibold text-amber-700">Attention</span>
              </div>
              <p className="mt-3 text-xs font-medium leading-snug text-slate-500 sm:mt-4 sm:text-sm">Needs Attention</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-amber-700 sm:text-3xl">{dashboardSummary.needsAttention}</p>
              <p className="mt-1 text-xs text-slate-500">Vehicles with active alerts</p>
            </button>

            {/* EXPIRED DOCUMENTS */}
            <button
              type="button"
              onClick={() => setVehicleFilter("expired")}
              aria-pressed={vehicleFilter === "expired"}
              className={`group w-full rounded-2xl border bg-gradient-to-br from-white to-red-50 p-3 text-left shadow-sm transition-colors duration-200 hover:shadow-md sm:p-5 focus:outline-none focus:ring-2 focus:ring-red-300 ${
                vehicleFilter === "expired" ? "border-red-400 ring-2 ring-red-100" : "border-red-100"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 text-xl sm:h-11 sm:w-11 sm:rounded-xl sm:text-2xl">📄</div>
                <span className="text-xs font-semibold text-red-700">Expired</span>
              </div>
              <p className="mt-3 text-xs font-medium leading-snug text-slate-500 sm:mt-4 sm:text-sm">Expired Documents</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-red-700 sm:text-3xl">{dashboardSummary.expiredDocuments}</p>
              <p className="mt-1 text-xs text-slate-500">Documents needing renewal</p>
            </button>

            {/* OVERDUE MAINTENANCE */}
            <button
              type="button"
              onClick={() => setVehicleFilter("maintenance")}
              aria-pressed={vehicleFilter === "maintenance"}
              className={`group w-full rounded-2xl border bg-gradient-to-br from-white to-orange-50 p-3 text-left shadow-sm transition-colors duration-200 hover:shadow-md sm:p-5 focus:outline-none focus:ring-2 focus:ring-orange-300 ${
                vehicleFilter === "maintenance" ? "border-orange-400 ring-2 ring-orange-100" : "border-orange-100"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100 text-xl sm:h-11 sm:w-11 sm:rounded-xl sm:text-2xl">🔧</div>
                <span className="text-xs font-semibold text-orange-700">Overdue</span>
              </div>
              <p className="mt-3 text-xs font-medium leading-snug text-slate-500 sm:mt-4 sm:text-sm">Overdue Maintenance</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-orange-700 sm:text-3xl">{dashboardSummary.overdueMaintenance}</p>
              <p className="mt-1 text-xs text-slate-500">Maintenance tasks overdue</p>
            </button>
          </div>
        </section>

        {/* VEHICLES SECTION */}

        <div className="mt-7 sm:mt-10">
          <h2 className="mb-4 text-xl font-bold tracking-tight text-slate-900 sm:mb-6 sm:text-2xl">
            {t("myVehicles")}
          </h2>

          {/* ACTIVE VEHICLE FILTER */}

          {vehicleFilter !== "all" && (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-100 bg-white/80 px-4 py-3 shadow-sm">
              <p className="text-sm text-slate-600">
                Showing:{" "}
                <span className="font-bold text-blue-700">
                  {{
                    healthy: "No Urgent Alerts",
                    attention: "Needs Attention",
                    expired: "Expired Documents",
                    maintenance: "Overdue Maintenance",
                  }[vehicleFilter]}
                </span>
              </p>

              <button
                type="button"
                onClick={() => setVehicleFilter("all")}
                className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
              >
                Clear Filter ✕
              </button>
            </div>
          )}

          {/* SEARCH AND SORT VEHICLES */}
          {vehicles.length > 0 && (
            <div className="mb-5 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-2xl sm:p-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_230px]">
                <div>
                  <label htmlFor="vehicle-search" className="mb-2 block text-sm font-semibold text-slate-700">
                    Search your vehicles
                  </label>
                  <div className="relative">
                    <svg className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <circle cx="11" cy="11" r="7" />
                      <path strokeLinecap="round" d="m20 20-4-4" />
                    </svg>
                    <input
                      id="vehicle-search"
                      type="search"
                      value={vehicleSearch}
                      onChange={(event) => setVehicleSearch(event.target.value)}
                      placeholder="Registration, brand, model, type..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-10 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />
                    {vehicleSearch && (
                      <button
                        type="button"
                        onClick={() => setVehicleSearch("")}
                        aria-label="Clear vehicle search"
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-2 py-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="vehicle-sort" className="mb-2 block text-sm font-semibold text-slate-700">
                    Sort vehicles
                  </label>
                  <select
                    id="vehicle-sort"
                    value={vehicleSort}
                    onChange={(event) => setVehicleSort(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="recent">Recently added</option>
                    <option value="name-asc">Name: A–Z</option>
                    <option value="name-desc">Name: Z–A</option>
                    <option value="health-high">Health score: Highest first</option>
                    <option value="health-low">Health score: Lowest first</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                <p className="text-sm text-slate-500" aria-live="polite">
                  Showing <span className="font-bold text-slate-800">{filteredVehicles.length}</span> of{" "}
                  <span className="font-bold text-slate-800">{vehicles.length}</span> vehicles
                  {vehicleSearch.trim() ? <> matching <span className="font-semibold text-blue-700">“{vehicleSearch.trim()}”</span></> : null}
                </p>
                {(vehicleSearch || vehicleSort !== "recent") && (
                  <button
                    type="button"
                    onClick={() => {
                      setVehicleSearch("");
                      setVehicleSort("recent");
                    }}
                    className="rounded-lg px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
                  >
                    Reset search & sort
                  </button>
                )}
              </div>
            </div>
          )}

          {vehicles.length === 0 ? (
            /* NO VEHICLES */

            <div className="bg-white rounded-2xl shadow-sm border p-8 text-center">
              <div className="text-6xl">🚗</div>

              <h3 className="text-2xl font-bold mt-4">
                {t("noVehiclesYet")}
              </h3>

              <p className="text-gray-500 mt-3">
                {t("addFirstVehicleMessage")}
              </p>

              <button
                type="button"
                onClick={() => navigate("/add-vehicle")}
                className="mt-6 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl"
              >
                {t("addYourFirstVehicle")}
              </button>
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl">🔎</div>
              <h3 className="mt-4 text-xl font-bold text-slate-800">No matching vehicles</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                Try another registration number, brand, model, or vehicle type. You can also clear your current overview filter.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                {vehicleSearch && (
                  <button
                    type="button"
                    onClick={() => setVehicleSearch("")}
                    className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    Clear search
                  </button>
                )}
                {vehicleFilter !== "all" && (
                  <button
                    type="button"
                    onClick={() => setVehicleFilter("all")}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Clear overview filter
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* VEHICLE LIST */

            <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 xl:grid-cols-3 sm:gap-5">
              {filteredVehicles.map((vehicle) => {
                // Document alerts belong to this vehicle.
                const alerts = getVehicleAlerts(vehicle);

                const documentNeedsAttention = alerts.some((alert) =>
                  ["expired", "today", "warning"].includes(alert.status)
                );

                // IMPORTANT:
                // Calculate maintenance alerts INSIDE this vehicle loop.
                // This prevents the "vehicle is not defined" error.
                const maintenanceAlerts = calculateMaintenanceAlerts(
                  vehicle.maintenanceReminders || []
                );

                const maintenanceNeedsAttention = maintenanceAlerts.some(
                  (reminder) =>
                    reminder.alertStatus === "overdue" ||
                    reminder.alertStatus === "dueSoon"
                );

                // Calculate detailed vehicle health score.
                const vehicleHealth = calculateVehicleHealth(
                  vehicle,
                  alerts,
                  maintenanceAlerts
                );

                const needsAttention =
                  documentNeedsAttention || maintenanceNeedsAttention;

                const isHealthExpanded =
                  expandedHealth[vehicle.id] ?? needsAttention;


                return (
                  <div
                    key={vehicle.id}
                    className="mb-0 w-full min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-md sm:rounded-2xl sm:p-5"
                  >
                    {/* VEHICLE HEADER */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        {/* Vehicle Icon */}
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-xl">
                          🚗
                        </div>

                        {/* Vehicle Information */}
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-lg font-bold tracking-tight text-slate-900">
                            {[vehicle.brand, vehicle.model].filter(Boolean).join(" ") || "Vehicle"}
                          </h3>

                          <p className="mt-1 break-words font-mono text-xs font-semibold tracking-wide text-slate-500">
                            {vehicle.vehicleNumber || "Registration number unavailable"}
                          </p>
                        </div>
                      </div>

                      {/* Verification Badge */}
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${vehicle.status === "Verified"
                          ? "border-green-200 bg-green-50 text-green-700"
                          : vehicle.status === "Rejected"
                            ? "border-red-200 bg-red-50 text-red-700"
                            : "border-amber-200 bg-amber-50 text-amber-700"
                          }`}
                      >
                        <span>
                          {vehicle.status === "Verified"
                            ? "✓"
                            : vehicle.status === "Rejected"
                              ? "✕"
                              : "◷"}
                        </span>

                        {vehicle.status === "Verified"
                          ? "Verified"
                          : vehicle.status === "Rejected"
                            ? "Rejected"
                            : "Pending"}
                      </span>
                    </div>

                    {/* BASIC DETAILS */}
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {/* Vehicle Type */}
                      {vehicle.vehicleType && (
                        <span className="inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
                          <span className="text-base">
                            {(() => {
                              const type = vehicle.vehicleType.toLowerCase();

                              if (type.includes("motorcycle") || type.includes("bike")) {
                                return "🏍️";
                              }

                              if (type.includes("tractor")) {
                                return "🚜";
                              }

                              if (type.includes("car")) {
                                return "🚗";
                              }

                              if (type.includes("truck")) {
                                return "🚚";
                              }

                              if (type.includes("bus")) {
                                return "🚌";
                              }

                              if (type.includes("scooter")) {
                                return "🛵";
                              }

                              if (type.includes("van")) {
                                return "🚐";
                              }

                              return "🚘";
                            })()}
                          </span>

                          {vehicle.vehicleType}
                        </span>
                      )}

                      {/* Vehicle Color */}
                      {vehicle.color && (
                        <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full border border-slate-300"
                            style={{
                              backgroundColor: vehicle.color?.toLowerCase() || "#94a3b8",
                            }}
                          />

                          <span>
                            {t("color")}:{" "}
                            <span className="font-semibold text-slate-800">
                              {vehicle.color}
                            </span>
                          </span>
                        </span>
                      )}
                    </div>

                    {/* VEHICLE HEALTH */}

                    <div className="mt-4 border border-gray-200 rounded-xl overflow-hidden">
                      {/* VEHICLE HEALTH SCORE */}

                      <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-white via-blue-50/70 to-indigo-50/70 p-4 shadow-sm shadow-blue-100/50 transition-all duration-300 hover:shadow-md">

                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                              Vehicle Health Score
                            </p>

                            <div className="mt-2 flex items-baseline gap-2">
                              <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                                {vehicleHealth.score !== null
                                  ? `${vehicleHealth.score}%`
                                  : "N/A"}
                              </span>

                              <span
                                className={`text-xs font-bold ${vehicleHealth.color === "green"
                                  ? "text-green-600"
                                  : vehicleHealth.color === "yellow"
                                    ? "text-yellow-600"
                                    : vehicleHealth.color === "orange"
                                      ? "text-orange-600"
                                      : vehicleHealth.color === "red"
                                        ? "text-red-600"
                                        : "text-slate-500"
                                  }`}
                              >
                                {vehicleHealth.label}
                              </span>
                            </div>
                          </div>

                          <div
                            className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl ${vehicleHealth.color === "green"
                              ? "bg-green-100"
                              : vehicleHealth.color === "yellow"
                                ? "bg-yellow-100"
                                : vehicleHealth.color === "orange"
                                  ? "bg-orange-100"
                                  : vehicleHealth.color === "red"
                                    ? "bg-red-100"
                                    : "bg-slate-100"
                              }`}
                          >
                            {vehicleHealth.color === "green"
                              ? "🟢"
                              : vehicleHealth.color === "yellow"
                                ? "🟡"
                                : vehicleHealth.color === "orange"
                                  ? "🟠"
                                  : vehicleHealth.color === "red"
                                    ? "🔴"
                                    : "📋"}
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${vehicleHealth.color === "green"
                                ? "bg-green-500"
                                : vehicleHealth.color === "yellow"
                                  ? "bg-yellow-500"
                                  : vehicleHealth.color === "orange"
                                    ? "bg-orange-500"
                                    : vehicleHealth.color === "red"
                                      ? "bg-red-500"
                                      : "bg-slate-400"
                                }`}
                              style={{
                                width: `${vehicleHealth.score !== null
                                  ? vehicleHealth.score
                                  : 0
                                  }%`,
                              }}
                            />
                          </div>



                          <p className="mt-2 text-xs text-slate-500">
                            Based on {vehicleHealth.knownItems} of{" "}
                            {vehicleHealth.totalItems} assessed items.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedHealth((previous) => ({
                            ...previous,
                            [vehicle.id]: !isHealthExpanded,
                          }))
                        }
                        className={`w-full flex items-center justify-between px-4 py-3 transition-all duration-200 ${needsAttention
                          ? "bg-gradient-to-r from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100"
                          : "bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100"
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🩺</span>

                          <span
                            className={`text-sm font-semibold ${needsAttention
                              ? "text-orange-800"
                              : "text-blue-800"
                              }`}
                          >
                            Vehicle Health
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {needsAttention ? (
                            <span className="text-xs font-semibold text-orange-600">
                              🟠 Attention Needed
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-green-600">
                              🟢 Healthy
                            </span>
                          )}

                          <span className="text-gray-500 text-sm">
                            {isHealthExpanded ? "▲" : "▼"}
                          </span>
                        </div>
                      </button>

                      {/* HEALTH DETAILS */}

                      {isHealthExpanded && (
                        <div className="bg-white p-3 space-y-2">
                          {/* DOCUMENT ALERTS */}

                          {["Bluebook", "Insurance", "Tax"].map((documentType) => {
                            const alert = alerts.find(
                              (item) => item.documentType === documentType
                            );

                            if (!alert || alert.status === "unknown") {
                              return null;
                            }

                            const isExpired = alert.status === "expired";
                            const isWarning = alert.status === "warning";
                            const isToday = alert.status === "today";
                            const isNoExpiry = alert.status === "noExpiry";

                            const icon =
                              documentType === "Bluebook"
                                ? "📘"
                                : documentType === "Insurance"
                                  ? "🛡️"
                                  : "💰";

                            const statusLabel = isExpired
                              ? "Expired"
                              : isToday
                                ? "Due Today"
                                : isWarning
                                  ? "Expiring Soon"
                                  : isNoExpiry
                                    ? "No Expiry Date"
                                    : "Valid";

                            const statusColor = isExpired
                              ? "bg-red-100 text-red-700 ring-red-200"
                              : isToday
                                ? "bg-orange-100 text-orange-700 ring-orange-200"
                                : isWarning
                                  ? "bg-amber-100 text-amber-700 ring-amber-200"
                                  : isNoExpiry
                                    ? "bg-slate-100 text-slate-600 ring-slate-200"
                                    : "bg-emerald-100 text-emerald-700 ring-emerald-200";

                            const cardColor = isExpired
                              ? "border-red-200 hover:border-red-300 hover:bg-red-50"
                              : isToday
                                ? "border-orange-200 hover:border-orange-300 hover:bg-orange-50"
                                : isWarning
                                  ? "border-amber-200 hover:border-amber-300 hover:bg-amber-50"
                                  : isNoExpiry
                                    ? "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                    : "border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50";

                            const iconBackground = isExpired
                              ? "bg-red-100"
                              : isToday
                                ? "bg-orange-100"
                                : isWarning
                                  ? "bg-amber-100"
                                  : isNoExpiry
                                    ? "bg-slate-100"
                                    : "bg-emerald-100";

                            return (
                              <button
                                key={documentType}
                                type="button"
                                onClick={() => handleAlertClick(vehicle.id, documentType)}
                                className={`group w-full flex items-center justify-between gap-3 rounded-xl border bg-white p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300 ${cardColor}`}
                              >
                                {/* Left: Icon and document details */}
                                <div className="flex min-w-0 items-center gap-3">
                                  <div
                                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl transition-transform duration-200 group-hover:scale-105 ${iconBackground}`}
                                  >
                                    {icon}
                                  </div>

                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-bold text-slate-800">
                                      {documentType}
                                    </p>

                                    <p className="mt-1 truncate text-xs text-slate-500">
                                      {alert.message}
                                    </p>
                                  </div>
                                </div>

                                {/* Right: Status and navigation */}
                                <div className="flex shrink-0 flex-col items-end gap-2">
                                  <span
                                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${statusColor}`}
                                  >
                                    {statusLabel}
                                  </span>

                                  <span className="flex items-center gap-1 text-xs font-semibold text-slate-400 transition-colors group-hover:text-blue-600">
                                    View
                                    <svg
                                      className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                      strokeWidth={2}
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M9 5l7 7-7 7"
                                      />
                                    </svg>
                                  </span>
                                </div>
                              </button>
                            );
                          })}

                          {/* MAINTENANCE ALERTS */}

                          {maintenanceAlerts.length > 0 && (
                            <div className="pt-3 mt-3 border-t border-gray-200">
                              <h4 className="text-sm font-bold text-gray-800 mb-2">
                                🔧 Maintenance Alerts
                              </h4>

                              <div className="space-y-2">
                                {maintenanceAlerts.map((reminder) => {
                                  const isOverdue =
                                    reminder.alertStatus === "overdue";

                                  const title =
                                    reminder.title ||
                                    reminder.reminderType ||
                                    "Maintenance";

                                  let message = isOverdue
                                    ? "Maintenance is overdue"
                                    : "Maintenance is due soon";

                                  if (
                                    !isOverdue &&
                                    reminder.daysRemaining !== null &&
                                    reminder.daysRemaining !== undefined
                                  ) {
                                    message += ` · ${reminder.daysRemaining} day(s) remaining`;
                                  }

                                  return (
                                    <button
                                      key={reminder.id}
                                      type="button"
                                      onClick={() =>
                                        navigate(
                                          `/vehicle/${vehicle.id}/maintenance-reminders`
                                        )
                                      }
                                      className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border text-left transition ${isOverdue
                                        ? "bg-red-50 border-red-100 hover:bg-red-100"
                                        : "bg-amber-50 border-amber-100 hover:bg-amber-100"
                                        }`}
                                    >
                                      <div className="min-w-0">
                                        <p
                                          className={`text-sm font-semibold ${isOverdue
                                            ? "text-red-700"
                                            : "text-amber-700"
                                            }`}
                                        >
                                          {isOverdue ? "🔴 " : "🟠 "}
                                          {title}
                                        </p>

                                        <p
                                          className={`text-xs mt-1 ${isOverdue
                                            ? "text-red-600"
                                            : "text-amber-600"
                                            }`}
                                        >
                                          {message}
                                        </p>
                                      </div>

                                      <span className="text-xs font-semibold text-gray-500 shrink-0">
                                        View →
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* NO ALERTS */}

                          {!documentNeedsAttention &&
                            !maintenanceNeedsAttention && (
                              <p className="text-sm text-green-700 bg-green-50 rounded-lg p-3">
                                ✅ No urgent vehicle health alerts.
                              </p>
                            )}
                        </div>
                      )}
                    </div>

                    {/* PENDING STATUS */}

                    {
                      vehicle.status === "Pending" && (
                        <div className="mt-4 bg-yellow-50 border border-yellow-100 rounded-xl px-3.5 py-3">
                          <p className="text-sm font-semibold text-yellow-800">
                            ⏳ Verification Pending
                          </p>

                          <p className="text-xs text-yellow-700 mt-1">
                            Waiting for Admin verification.
                          </p>
                        </div>
                      )
                    }

                    {/* VERIFIED STATUS */}

                    {
                      vehicle.status === "Verified" && (
                        <div className="mt-4 bg-green-50 border border-green-100 rounded-xl px-3.5 py-3">
                          <p className="text-sm font-semibold text-green-800">
                            ✓ Vehicle Verified
                          </p>

                          <p className="text-xs text-green-700 mt-1">
                            Your vehicle has been successfully verified.
                          </p>
                        </div>
                      )
                    }

                    {/* REJECTED STATUS */}

                    {
                      vehicle.status === "Rejected" && (
                        <div className="mt-4 bg-red-50 border border-red-100 rounded-xl px-3.5 py-3">
                          <p className="text-sm font-semibold text-red-800">
                            ✕ Vehicle Rejected
                          </p>

                          <p className="text-xs font-semibold text-red-700 mt-2">
                            Reason
                          </p>

                          <p className="text-xs text-red-700 mt-1">
                            {vehicle.rejectionReason ||
                              "Details not submitted"}
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/add-vehicle/manual?resubmit=${vehicle.id}`
                              )
                            }
                            className="mt-3 w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                          >
                            🔄 Resubmit Vehicle
                          </button>
                        </div>
                      )
                    }

                    {/* MANAGE VEHICLE */}
                    <button
                      type="button"
                      onClick={() => navigate(`/vehicle/${vehicle.id}`)}
                      className="group mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-blue-100 active:translate-y-0"
                    >
                      <span>{t("manageVehicle")}</span>

                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 12h14m-7-7 7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ADD ANOTHER VEHICLE */}

        {vehicles.length > 0 && (
          <div className="mt-8 bg-gray-50 rounded-2xl border p-6 text-center">
            <h3 className="text-xl font-bold">
              + {t("addAnotherVehicle")}
            </h3>

            <p className="text-gray-500 mt-2">
              {t("registerAnotherVehicle")}
            </p>

            <button
              type="button"
              onClick={() => navigate("/add-vehicle")}
              className="mt-6 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl"
            >
              {t("addVehicle")}
            </button>
          </div>
        )}
      </div>
    </div >
  );
}

export default Dashboard;