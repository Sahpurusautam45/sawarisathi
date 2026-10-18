import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
    addServiceRecord,
    getServiceHistory,
    deleteServiceRecord,
    updateServiceRecord,
} from "../services/serviceHistoryService";

function ServiceHistory() {
    const { vehicleId } = useParams();
    const navigate = useNavigate();

    const [services, setServices] = useState([]);
    // ==========================================
    // SERVICE HISTORY STATISTICS
    // ==========================================

    const totalServices = services.length;

    const totalMaintenanceCost = services.reduce(
        (total, service) => total + (Number(service.cost) || 0),
        0
    );

    const latestService = services.reduce((latest, service) => {
        if (!latest) return service;

        if (!service.serviceDate) return latest;
        if (!latest.serviceDate) return service;

        return service.serviceDate > latest.serviceDate
            ? service
            : latest;
    }, null);

    const lastServiceDate = latestService?.serviceDate || "N/A";

    const lastServiceKM =
        latestService?.kilometer !== undefined &&
            latestService?.kilometer !== null
            ? latestService.kilometer
            : "N/A";
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingServiceId, setEditingServiceId] = useState(null);

    const [formData, setFormData] = useState({
        serviceDate: "",
        kilometer: "",
        serviceType: "",
        workDone: "",
        cost: "",
        garage: "",
        notes: "",
    });

    // ==========================================
    // LOAD SERVICE HISTORY
    // ==========================================

    const loadServices = async () => {
        try {
            setLoading(true);

            const data = await getServiceHistory(vehicleId);

            setServices(data);
        } catch (error) {
            console.error("Service History Error:", error);
            alert("Unable to load service history.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadServices();
    }, [vehicleId]);

    // ==========================================
    // FORM CHANGE
    // ==========================================

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // ==========================================
    // ADD SERVICE
    // ==========================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (
            !formData.serviceDate ||
            !formData.kilometer ||
            !formData.serviceType
        ) {
            alert(
                "Please enter service date, kilometer and service type."
            );
            return;
        }

        try {
            setSaving(true);

            const serviceData = {
                serviceDate: formData.serviceDate,
                kilometer: Number(formData.kilometer),
                serviceType: formData.serviceType,
                workDone: formData.workDone.trim(),
                cost: formData.cost ? Number(formData.cost) : 0,
                garage: formData.garage.trim(),
                notes: formData.notes.trim(),
            };

            if (editingServiceId) {
                // UPDATE existing record
                await updateServiceRecord(
                    vehicleId,
                    editingServiceId,
                    serviceData
                );

                alert("✅ Service record updated successfully.");
            } else {
                // ADD new record
                await addServiceRecord(
                    vehicleId,
                    serviceData
                );

                alert("✅ Service record added successfully.");
            }


            setFormData({
                serviceDate: "",
                kilometer: "",
                serviceType: "",
                workDone: "",
                cost: "",
                garage: "",
                notes: "",
            });

            setEditingServiceId(null);
            setShowForm(false);

            await loadServices();
        } catch (error) {
            console.error("Add Service Error:", error);
            alert("Failed to add service record.");
        } finally {
            setSaving(false);
        }
    };

    // ==========================================
    // DELETE SERVICE
    // ==========================================

    // ==========================================
    // EDIT SERVICE RECORD
    // ==========================================

    const handleEdit = (service) => {
        setFormData({
            serviceDate: service.serviceDate || "",
            kilometer: service.kilometer || "",
            serviceType: service.serviceType || "",
            workDone: service.workDone || "",
            cost: service.cost || "",
            garage: service.garage || "",
            notes: service.notes || "",
        });

        setEditingServiceId(service.id);
        setShowForm(true);

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    const handleDelete = async (serviceId) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this service record?"
        );

        if (!confirmed) return;

        try {
            await deleteServiceRecord(
                vehicleId,
                serviceId
            );

            await loadServices();

            alert("Service record deleted.");
        } catch (error) {
            console.error("Delete Service Error:", error);
            alert("Failed to delete service record.");
        }
    };



    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100">
                <p className="text-gray-600 text-lg">
                    Loading service history...
                </p>
            </div>
        );
    }

    // ==========================================
    // PAGE
    // ==========================================

    return (
        <div className="min-h-screen bg-slate-100 p-6 md:p-8">

            <div className="max-w-5xl mx-auto">

                {/* HEADER */}

                <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">

                    <button
                        type="button"
                        onClick={() => navigate(`/vehicle/${vehicleId}`)}
                        className="mb-6 inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold transition"
                    >
                        ← Back to Vehicle
                    </button>

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold">
                                🛠️ Service History
                            </h1>

                            <p className="text-gray-500 mt-2">
                                Keep track of your vehicle's servicing,
                                repairs and maintenance.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowForm((prev) => !prev)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition"
                        >
                            {showForm
                                ? "✖ Close"
                                : editingServiceId
                                    ? "✏️ Edit Service Record"
                                    : "➕ Add Service Record"}
                        </button>

                    </div>

                    {/* ========================================== */}
                    {/* SERVICE STATISTICS */}
                    {/* ========================================== */}

                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

                        {/* TOTAL SERVICES */}
                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-blue-700">
                                        Total Services
                                    </p>

                                    <h3 className="text-3xl font-bold text-blue-900 mt-2">
                                        {totalServices}
                                    </h3>
                                </div>

                                <div className="text-3xl">
                                    🔧
                                </div>
                            </div>

                            <p className="text-sm text-blue-600 mt-3">
                                Recorded service visits
                            </p>
                        </div>


                        {/* TOTAL MAINTENANCE COST */}
                        <div className="bg-green-50 border border-green-100 rounded-2xl p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-green-700">
                                        Total Maintenance Cost
                                    </p>

                                    <h3 className="text-2xl font-bold text-green-900 mt-2">
                                        NPR {totalMaintenanceCost.toLocaleString("en-IN")}
                                    </h3>
                                </div>

                                <div className="text-3xl">
                                    💰
                                </div>
                            </div>

                            <p className="text-sm text-green-600 mt-3">
                                Total recorded expenses
                            </p>
                        </div>


                        {/* LAST SERVICE DATE */}
                        <div className="bg-purple-50 border border-purple-100 rounded-2xl p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-purple-700">
                                        Last Service Date
                                    </p>

                                    <h3 className="text-xl font-bold text-purple-900 mt-2">
                                        {lastServiceDate}
                                    </h3>
                                </div>

                                <div className="text-3xl">
                                    📅
                                </div>
                            </div>

                            <p className="text-sm text-purple-600 mt-3">
                                Most recent service visit
                            </p>
                        </div>


                        {/* LAST SERVICE KILOMETER */}
                        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-orange-700">
                                        Last Service KM
                                    </p>

                                    <h3 className="text-2xl font-bold text-orange-900 mt-2">
                                        {lastServiceKM === "N/A"
                                            ? "N/A"
                                            : `${Number(lastServiceKM).toLocaleString("en-IN")} km`}
                                    </h3>
                                </div>

                                <div className="text-3xl">
                                    🛣️
                                </div>
                            </div>

                            <p className="text-sm text-orange-600 mt-3">
                                Latest odometer reading
                            </p>
                        </div>

                    </div>

                    {/* ADD SERVICE FORM */}

                    {showForm && (
                        <form
                            onSubmit={handleSubmit}
                            className="mt-8 bg-slate-50 border rounded-2xl p-6"
                        >

                            <h2 className="text-2xl font-bold">
                                {editingServiceId
                                    ? "✏️ Edit Service Record"
                                    : "➕ Add Service Record"}
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                                {/* DATE */}

                                <div>
                                    <label className="block font-semibold mb-2">
                                        Service Date *
                                    </label>

                                    <input
                                        type="date"
                                        name="serviceDate"
                                        value={formData.serviceDate}
                                        onChange={handleChange}
                                        className="w-full border rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {/* KM */}

                                <div>
                                    <label className="block font-semibold mb-2">
                                        Kilometer Reading *
                                    </label>

                                    <input
                                        type="number"
                                        name="kilometer"
                                        value={formData.kilometer}
                                        onChange={handleChange}
                                        placeholder="e.g. 48250"
                                        min="0"
                                        className="w-full border rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {/* SERVICE TYPE */}

                                <div>
                                    <label className="block font-semibold mb-2">
                                        Service Type *
                                    </label>

                                    <select
                                        name="serviceType"
                                        value={formData.serviceType}
                                        onChange={handleChange}
                                        className="w-full border rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">
                                            Select Service Type
                                        </option>

                                        <option value="General Service">
                                            General Service
                                        </option>

                                        <option value="Oil Change">
                                            Oil Change
                                        </option>

                                        <option value="Repair">
                                            Repair
                                        </option>

                                        <option value="Brake Service">
                                            Brake Service
                                        </option>

                                        <option value="Engine Service">
                                            Engine Service
                                        </option>

                                        <option value="Electrical Service">
                                            Electrical Service
                                        </option>

                                        <option value="Tyre Service">
                                            Tyre Service
                                        </option>

                                        <option value="Other">
                                            Other
                                        </option>
                                    </select>
                                </div>

                                {/* COST */}

                                <div>
                                    <label className="block font-semibold mb-2">
                                        Cost (₹)
                                    </label>

                                    <input
                                        type="number"
                                        name="cost"
                                        value={formData.cost}
                                        onChange={handleChange}
                                        placeholder="e.g. 1850"
                                        min="0"
                                        className="w-full border rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                            </div>

                            {/* WORK DONE */}

                            <div className="mt-5">

                                <label className="block font-semibold mb-2">
                                    Work / Parts Replaced
                                </label>

                                <textarea
                                    name="workDone"
                                    value={formData.workDone}
                                    onChange={handleChange}
                                    rows="3"
                                    placeholder="e.g. Engine oil changed, brake pads replaced..."
                                    className="w-full border rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />

                            </div>

                            {/* GARAGE */}

                            <div className="mt-5">

                                <label className="block font-semibold mb-2">
                                    Garage / Service Center
                                </label>

                                <input
                                    type="text"
                                    name="garage"
                                    value={formData.garage}
                                    onChange={handleChange}
                                    placeholder="Enter garage or service center name"
                                    className="w-full border rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />

                            </div>

                            {/* NOTES */}

                            <div className="mt-5">

                                <label className="block font-semibold mb-2">
                                    Notes
                                </label>

                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    rows="3"
                                    placeholder="Any additional notes..."
                                    className="w-full border rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />

                            </div>

                            {/* SUBMIT */}

                            <button
                                type="submit"
                                disabled={saving}
                                className="mt-6 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-6 py-3 rounded-xl font-semibold transition"
                            >
                                {saving
                                    ? "Saving..."
                                    : editingServiceId
                                        ? "✏️ Update Service Record"
                                        : "💾 Save Service Record"}
                            </button>

                        </form>
                    )}

                    {/* SERVICE LIST */}

                    <div className="mt-8">

                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold">
                                Recent Services
                            </h2>

                            <span className="text-sm text-gray-500">
                                {services.length} records
                            </span>
                        </div>

                        {services.length === 0 ? (

                            <div className="bg-white border rounded-xl p-6 text-center">
                                <div className="text-4xl">🛠️</div>

                                <h3 className="text-lg font-bold mt-3">
                                    No Service Records Yet
                                </h3>

                                <p className="text-gray-500 text-sm mt-1">
                                    Add your first service record to track vehicle maintenance.
                                </p>
                            </div>

                        ) : (

                            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">

                                {services.map((service, index) => (

                                    <div
                                        key={service.id}
                                        className={`px-4 py-4 hover:bg-slate-50 transition ${index !== services.length - 1
                                            ? "border-b border-gray-200"
                                            : ""
                                            }`}
                                    >

                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">

                                            {/* SERVICE DETAILS */}

                                            <div className="flex-1 min-w-0">

                                                <div className="flex flex-wrap items-center gap-2">

                                                    <span className="text-sm font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-md">
                                                        Service {service.serviceNumber || index + 1}
                                                    </span>

                                                    <h3 className="font-bold text-gray-900">
                                                        🔧 {service.serviceType}
                                                    </h3>

                                                </div>

                                                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-2 text-sm text-gray-500">

                                                    <span>
                                                        📅 {service.serviceDate}
                                                    </span>

                                                    <span>
                                                        🛣️ {Number(service.kilometer || 0).toLocaleString("en-IN")} km
                                                    </span>

                                                    <span className="font-semibold text-green-700">
                                                        💰 NPR {Number(service.cost || 0).toLocaleString("en-IN")}
                                                    </span>

                                                    {service.garage && (
                                                        <span>
                                                            🏪 {service.garage}
                                                        </span>
                                                    )}

                                                </div>

                                                {service.workDone && (
                                                    <p className="text-sm text-gray-600 mt-2 break-words">
                                                        <span className="font-semibold">
                                                            Work:
                                                        </span>{" "}
                                                        {service.workDone}
                                                    </p>
                                                )}

                                                {service.notes && (
                                                    <p className="text-sm text-gray-500 mt-1 break-words">
                                                        <span className="font-semibold">
                                                            Notes:
                                                        </span>{" "}
                                                        {service.notes}
                                                    </p>
                                                )}

                                            </div>


                                            {/* ACTION BUTTONS */}

                                            <div className="flex items-center gap-2 shrink-0">

                                                {/* EDIT BUTTON */}

                                                <button
                                                    type="button"
                                                    onClick={() => handleEdit(service)}
                                                    className="px-3 py-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition font-semibold text-sm"
                                                >
                                                    ✏️ Edit
                                                </button>

                                                {/* DELETE BUTTON */}

                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(service.id)}
                                                    className="px-3 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition font-semibold text-sm"
                                                >
                                                    🗑️ Delete
                                                </button>

                                            </div>

                                        </div>

                                    </div>

                                ))}

                            </div>

                        )}

                    </div>

                    {/* BACK */}



                </div>

            </div>

        </div>
    );
}

export default ServiceHistory;