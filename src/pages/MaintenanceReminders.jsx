import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
    addMaintenanceReminder,
    getMaintenanceReminders,
    updateMaintenanceReminder,
    completeMaintenanceReminder,
    deleteMaintenanceReminder,
} from "../services/maintenanceReminderService";

function MaintenanceReminders() {
    const { vehicleId } = useParams();
    const navigate = useNavigate();

    const [reminders, setReminders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const initialForm = {
        title: "",
        reminderType: "General Service",
        dueDate: "",
        dueKilometer: "",
        currentKilometer: "",
        notes: "",
    };

    const [formData, setFormData] = useState(initialForm);

    // ==========================================
    // LOAD REMINDERS
    // ==========================================

    const loadReminders = async () => {
        try {
            setLoading(true);

            const data = await getMaintenanceReminders(vehicleId);
            setReminders(data);
            return true;
        } catch (error) {
            console.error("Load Reminders Error:", error);
            console.error("Firebase error code:", error?.code);
            console.error("Firebase error message:", error?.message);

            setReminders([]);
            alert(
                `Unable to load maintenance reminders.\n\nError: ${error?.code || error?.message || "Unknown error"
                }`
            );

            return false;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (vehicleId) {
            loadReminders();
        }
    }, [vehicleId]);

    // ==========================================
    // FORM CHANGE
    // ==========================================

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    // ==========================================
    // RESET FORM
    // ==========================================

    const resetForm = () => {
        setFormData(initialForm);
        setEditingId(null);
        setShowForm(false);
    };

    // ==========================================
    // REMINDER STATUS
    // ==========================================

    const getReminderStatus = (reminder) => {
        if (reminder.completed) {
            return {
                label: "Completed",
                style: "bg-green-100 text-green-700",
            };
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dueDate = reminder.dueDate
            ? new Date(`${reminder.dueDate}T00:00:00`)
            : null;

        const daysRemaining = dueDate
            ? Math.ceil(
                (dueDate.getTime() - today.getTime()) /
                (1000 * 60 * 60 * 24)
            )
            : null;

        const currentKM = Number(reminder.currentKilometer);
        const dueKM = Number(reminder.dueKilometer);

        const hasCurrentKM =
            reminder.currentKilometer !== null &&
            reminder.currentKilometer !== "" &&
            reminder.currentKilometer !== undefined &&
            Number.isFinite(currentKM);

        const hasDueKM =
            reminder.dueKilometer !== null &&
            reminder.dueKilometer !== "" &&
            reminder.dueKilometer !== undefined &&
            Number.isFinite(dueKM);

        const kilometerOverdue =
            hasCurrentKM && hasDueKM && currentKM >= dueKM;

        if (
            (daysRemaining !== null && daysRemaining < 0) ||
            kilometerOverdue
        ) {
            return {
                label: "Overdue",
                style: "bg-red-100 text-red-700",
            };
        }

        if (
            (daysRemaining !== null && daysRemaining <= 7) ||
            (hasCurrentKM &&
                hasDueKM &&
                dueKM - currentKM <= 500)
        ) {
            return {
                label: "Due Soon",
                style: "bg-amber-100 text-amber-700",
            };
        }

        return {
            label: "Upcoming",
            style: "bg-blue-100 text-blue-700",
        };
    };

    // ==========================================
    // SAVE REMINDER
    // ==========================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            alert("Please enter a reminder title.");
            return;
        }

        if (
            !formData.dueDate &&
            formData.dueKilometer === ""
        ) {
            alert(
                "Please enter a due date, a due kilometer reading, or both."
            );
            return;
        }

        if (
            formData.dueKilometer !== "" &&
            (
                !Number.isFinite(Number(formData.dueKilometer)) ||
                Number(formData.dueKilometer) < 0
            )
        ) {
            alert("Please enter a valid due kilometer reading.");
            return;
        }

        if (
            formData.currentKilometer !== "" &&
            (
                !Number.isFinite(Number(formData.currentKilometer)) ||
                Number(formData.currentKilometer) < 0
            )
        ) {
            alert("Please enter a valid current kilometer reading.");
            return;
        }

        if (
            formData.dueKilometer !== "" &&
            formData.currentKilometer !== "" &&
            Number(formData.dueKilometer) <
            Number(formData.currentKilometer)
        ) {
            alert(
                "The due kilometer reading cannot be lower than the current reading."
            );
            return;
        }

        try {
            setSaving(true);

            const reminderData = {
                ...formData,
            };

            if (editingId) {
                await updateMaintenanceReminder(
                    vehicleId,
                    editingId,
                    reminderData
                );

                alert("Reminder updated successfully!");
            } else {
                await addMaintenanceReminder(
                    vehicleId,
                    reminderData
                );

                alert("Reminder added successfully!");
            }

            resetForm();
            await loadReminders();
        } catch (error) {
            console.error("Save Reminder Error:", error);
            alert("Unable to save the reminder.");
        } finally {
            setSaving(false);
        }
    };

    // ==========================================
    // EDIT REMINDER
    // ==========================================

    const handleEdit = (reminder) => {
        setFormData({
            title: reminder.title || "",
            reminderType: reminder.reminderType || "General Service",
            dueDate: reminder.dueDate || "",
            dueKilometer:
                reminder.dueKilometer ?? "",
            currentKilometer:
                reminder.currentKilometer ?? "",
            notes: reminder.notes || "",
        });

        setEditingId(reminder.id);
        setShowForm(true);

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    // ==========================================
    // COMPLETE REMINDER
    // ==========================================

    const handleComplete = async (reminderId) => {
        const confirmed = window.confirm(
            "Mark this maintenance reminder as completed?"
        );

        if (!confirmed) return;

        try {
            await completeMaintenanceReminder(
                vehicleId,
                reminderId
            );

            await loadReminders();
        } catch (error) {
            console.error("Complete Reminder Error:", error);
            alert("Unable to complete the reminder.");
        }
    };

    // ==========================================
    // DELETE REMINDER
    // ==========================================

    const handleDelete = async (reminderId) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this reminder?"
        );

        if (!confirmed) return;

        try {
            await deleteMaintenanceReminder(
                vehicleId,
                reminderId
            );

            await loadReminders();
        } catch (error) {
            console.error("Delete Reminder Error:", error);
            alert("Unable to delete the reminder.");
        }
    };

    // ==========================================
    // STATISTICS
    // ==========================================

    const activeReminders = reminders.filter(
        (reminder) => !reminder.completed
    );

    const overdueCount = activeReminders.filter(
        (reminder) =>
            getReminderStatus(reminder).label === "Overdue"
    ).length;

    const dueSoonCount = activeReminders.filter(
        (reminder) =>
            getReminderStatus(reminder).label === "Due Soon"
    ).length;

    const completedCount = reminders.filter(
        (reminder) => reminder.completed
    ).length;

    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100">
                <p className="text-gray-600 text-lg">
                    Loading maintenance reminders...
                </p>
            </div>
        );
    }

    // ==========================================
    // PAGE
    // ==========================================

    return (
        <div className="min-h-screen bg-slate-100 p-5 md:p-8">
            <div className="max-w-6xl mx-auto">

                {/* HEADER */}

                <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">

                    <button
                        type="button"
                        onClick={() =>
                            navigate(`/vehicle/${vehicleId}`)
                        }
                        className="mb-5 text-blue-600 hover:text-blue-800 font-semibold"
                    >
                        ← Back to Vehicle
                    </button>

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                🔔 Maintenance Reminders
                            </h1>

                            <p className="text-gray-500 mt-2">
                                Keep your vehicle maintenance on schedule.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                if (showForm) {
                                    resetForm();
                                } else {
                                    setShowForm(true);
                                }
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold"
                        >
                            {showForm
                                ? "✖ Close"
                                : "➕ Add Reminder"}
                        </button>
                    </div>

                    {/* STATISTICS */}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">

                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
                            <p className="text-sm text-blue-700">
                                Active Reminders
                            </p>

                            <h2 className="text-3xl font-bold text-blue-900 mt-2">
                                {activeReminders.length}
                            </h2>
                        </div>

                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
                            <p className="text-sm text-amber-700">
                                Due Soon
                            </p>

                            <h2 className="text-3xl font-bold text-amber-900 mt-2">
                                {dueSoonCount}
                            </h2>
                        </div>

                        <div className="bg-red-50 border border-red-100 rounded-xl p-5">
                            <p className="text-sm text-red-700">
                                Overdue
                            </p>

                            <h2 className="text-3xl font-bold text-red-900 mt-2">
                                {overdueCount}
                            </h2>
                        </div>

                        <div className="bg-green-50 border border-green-100 rounded-xl p-5">
                            <p className="text-sm text-green-700">
                                Completed
                            </p>

                            <h2 className="text-3xl font-bold text-green-900 mt-2">
                                {completedCount}
                            </h2>
                        </div>

                    </div>

                    {/* REMINDER FORM */}

                    {showForm && (
                        <form
                            onSubmit={handleSubmit}
                            className="mt-8 bg-slate-50 border rounded-2xl p-6"
                        >
                            <h2 className="text-xl font-bold mb-5">
                                {editingId
                                    ? "✏️ Edit Reminder"
                                    : "➕ Create Reminder"}
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                                <div>
                                    <label className="block text-sm font-semibold mb-2">
                                        Reminder Title *
                                    </label>

                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        placeholder="e.g. Change engine oil"
                                        required
                                        className="w-full border rounded-xl px-4 py-3 bg-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-2">
                                        Reminder Type *
                                    </label>

                                    <select
                                        name="reminderType"
                                        value={formData.reminderType}
                                        onChange={handleChange}
                                        className="w-full border rounded-xl px-4 py-3 bg-white"
                                    >
                                        <option value="General Service">
                                            General Service
                                        </option>

                                        <option value="Oil Change">
                                            Oil Change
                                        </option>

                                        <option value="Tyre Maintenance">
                                            Tyre Maintenance
                                        </option>

                                        <option value="Brake Inspection">
                                            Brake Inspection
                                        </option>

                                        <option value="Engine Service">
                                            Engine Service
                                        </option>

                                        <option value="Insurance Renewal">
                                            Insurance Renewal
                                        </option>

                                        <option value="Tax Renewal">
                                            Tax Renewal
                                        </option>

                                        <option value="Other">
                                            Other
                                        </option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-2">
                                        Due Date
                                    </label>

                                    <input
                                        type="date"
                                        name="dueDate"
                                        value={formData.dueDate}
                                        onChange={handleChange}
                                        className="w-full border rounded-xl px-4 py-3 bg-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-2">
                                        Due Odometer (km)
                                    </label>

                                    <input
                                        type="number"
                                        name="dueKilometer"
                                        value={formData.dueKilometer}
                                        onChange={handleChange}
                                        min="0"
                                        placeholder="e.g. 50000"
                                        className="w-full border rounded-xl px-4 py-3 bg-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-2">
                                        Current Odometer (km)
                                    </label>

                                    <input
                                        type="number"
                                        name="currentKilometer"
                                        value={formData.currentKilometer}
                                        onChange={handleChange}
                                        min="0"
                                        placeholder="e.g. 45000"
                                        className="w-full border rounded-xl px-4 py-3 bg-white"
                                    />
                                </div>

                            </div>

                            <div className="mt-5">
                                <label className="block text-sm font-semibold mb-2">
                                    Notes
                                </label>

                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    rows="3"
                                    placeholder="Add maintenance details..."
                                    className="w-full border rounded-xl px-4 py-3 bg-white"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="mt-6 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-6 py-3 rounded-xl font-semibold"
                            >
                                {saving
                                    ? "Saving..."
                                    : editingId
                                        ? "Update Reminder"
                                        : "Save Reminder"}
                            </button>
                        </form>
                    )}

                </div>

                {/* REMINDER HISTORY */}

                <div className="bg-white rounded-2xl shadow-sm mt-6 p-5 md:p-7">

                    <h2 className="text-2xl font-bold mb-5">
                        Your Reminders
                    </h2>

                    {reminders.length === 0 ? (
                        <div className="text-center py-12 border border-dashed rounded-xl">
                            <div className="text-5xl">🔔</div>

                            <h3 className="font-bold text-lg mt-4">
                                No Reminders Yet
                            </h3>

                            <p className="text-gray-500 text-sm mt-2">
                                Create your first maintenance reminder.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">

                            {reminders.map((reminder) => {
                                const status =
                                    getReminderStatus(reminder);

                                return (
                                    <div
                                        key={reminder.id}
                                        className="border rounded-xl p-5 hover:bg-slate-50"
                                    >
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                                            <div className="flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="text-lg font-bold text-gray-900">
                                                        {reminder.title}
                                                    </h3>

                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${status.style}`}>
                                                        {status.label}
                                                    </span>
                                                </div>

                                                <p className="text-sm text-gray-500 mt-2">
                                                    {reminder.reminderType}
                                                </p>

                                                <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600 mt-3">
                                                    {reminder.dueDate && (
                                                        <span>
                                                            📅 Due: {reminder.dueDate}
                                                        </span>
                                                    )}

                                                    {reminder.dueKilometer !== null &&
                                                        reminder.dueKilometer !== undefined && (
                                                            <span>
                                                                🛣️ Due at:{" "}
                                                                {Number(reminder.dueKilometer).toLocaleString("en-IN")} km
                                                            </span>
                                                        )}

                                                    {reminder.currentKilometer !== null &&
                                                        reminder.currentKilometer !== undefined && (
                                                            <span>
                                                                🚗 Current:{" "}
                                                                {Number(reminder.currentKilometer).toLocaleString("en-IN")} km
                                                            </span>
                                                        )}
                                                </div>

                                                {reminder.notes && (
                                                    <p className="text-sm text-gray-600 mt-3">
                                                        {reminder.notes}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                {!reminder.completed && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleComplete(reminder.id)
                                                        }
                                                        className="px-3 py-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 text-sm font-semibold"
                                                    >
                                                        ✓ Complete
                                                    </button>
                                                )}

                                                {!reminder.completed && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleEdit(reminder)
                                                        }
                                                        className="px-3 py-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 text-sm font-semibold"
                                                    >
                                                        ✏️ Edit
                                                    </button>
                                                )}

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleDelete(reminder.id)
                                                    }
                                                    className="px-3 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 text-sm font-semibold"
                                                >
                                                    🗑️ Delete
                                                </button>
                                            </div>

                                        </div>
                                    </div>
                                );
                            })}

                        </div>
                    )}

                </div>

            </div>
        </div>
    );
}

export default MaintenanceReminders;