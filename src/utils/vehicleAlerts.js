// ==========================================
// VEHICLE ALERT UTILITIES
// ==========================================

const getDaysRemaining = (dateValue) => {
  if (!dateValue) return null;

  const expiryDate = new Date(dateValue);

  if (Number.isNaN(expiryDate.getTime())) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiryDate.setHours(0, 0, 0, 0);

  const difference = expiryDate.getTime() - today.getTime();

  return Math.ceil(difference / (1000 * 60 * 60 * 24));
};


// ==========================================
// GET ALERT STATUS
// ==========================================

export const getAlertStatus = (dateValue) => {
  // No expiry date was supplied.
  if (dateValue === null || dateValue === undefined || dateValue === "") {
    return {
      status: "noExpiry",
      daysRemaining: null,
      message: "No expiry date",
    };
  }

  const daysRemaining = getDaysRemaining(dateValue);

  // A date was supplied, but it could not be parsed.
  if (daysRemaining === null) {
    return {
      status: "unknown",
      daysRemaining: null,
      message: "Expiry date unavailable",
    };
  }

  if (daysRemaining < 0) {
    const days = Math.abs(daysRemaining);

    return {
      status: "expired",
      daysRemaining,
      message: `Expired ${days} day${days === 1 ? "" : "s"} ago`,
    };
  }

  if (daysRemaining === 0) {
    return {
      status: "today",
      daysRemaining: 0,
      message: "Expires today",
    };
  }

  if (daysRemaining <= 30) {
    return {
      status: "warning",
      daysRemaining,
      message: `Expires in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}`,
    };
  }

  return {
    status: "valid",
    daysRemaining,
    message: `Valid for ${daysRemaining} days`,
  };
};


// ==========================================
// GET VEHICLE DOCUMENT ALERTS
// ==========================================

export const getVehicleAlerts = (vehicle) => {
  if (!vehicle) return [];

  const documents = [
    {
      type: "Bluebook",
      date: vehicle.bluebookExpiry,
    },
    {
      type: "Insurance",
      date: vehicle.insuranceExpiry,
    },
    {
      type: "Tax",
      date: vehicle.taxExpiry,
    },
  ];

  return documents.map((document) => {
    const alert = getAlertStatus(document.date);

    return {
      documentType: document.type,
      expiryDate: document.date || null,
      ...alert,
    };
  });
};