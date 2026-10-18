import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ExpenseAnalytics from "./ExpenseAnalytics";

import {
    addExpense,
    getExpenses,
    updateExpense,
    deleteExpense,
} from "../services/fuelExpenseService";

function FuelExpenses() {
    const { vehicleId } = useParams();
    const navigate = useNavigate();

    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingExpenseId, setEditingExpenseId] = useState(null);
    const formRef = useRef(null);

    const [formData, setFormData] = useState({
        expenseDate: "",
        category: "Fuel",
        fuelType: "Petrol",
        quantity: "",
        amount: "",
        odometer: "",
        description: "",
        vendor: "",
    });

    // ==========================================
    // LOAD EXPENSES
    // ==========================================

    const loadExpenses = async () => {
        try {
            setLoading(true);

            const data = await getExpenses(vehicleId);
            setExpenses(data);
        } catch (error) {
            console.error("Load Expenses Error:", error);
            alert("Unable to load expenses. Please check Firebase permissions.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (vehicleId) {
            loadExpenses();
        }
    }, [vehicleId]);

    useEffect(() => {
        if (showForm && formRef.current) {
            const timer = setTimeout(() => {
                formRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [showForm, editingExpenseId]);

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
        setFormData({
            expenseDate: "",
            category: "Fuel",
            fuelType: "Petrol",
            quantity: "",
            amount: "",
            odometer: "",
            description: "",
            vendor: "",
        });

        setEditingExpenseId(null);
        setShowForm(false);
    };

    // ==========================================
    // ADD / UPDATE EXPENSE
    // ==========================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.expenseDate || formData.amount === "") {
            alert("Please enter the expense date and amount.");
            return;
        }

        const amount = Number(formData.amount);
        const quantity = Number(formData.quantity);
        const odometer = Number(formData.odometer);

        if (!Number.isFinite(amount) || amount < 0) {
            alert("Please enter a valid expense amount.");
            return;
        }

        if (
            formData.category === "Fuel" &&
            (!formData.quantity ||
                !Number.isFinite(quantity) ||
                quantity <= 0)
        ) {
            alert("Please enter a valid fuel quantity in litres.");
            return;
        }

        if (
            formData.odometer !== "" &&
            (!Number.isFinite(odometer) || odometer < 0)
        ) {
            alert("Please enter a valid kilometer reading.");
            return;
        }

        const expenseData = {
            expenseDate: formData.expenseDate,
            category: formData.category,
            fuelType:
                formData.category === "Fuel"
                    ? formData.fuelType
                    : "",
            quantity:
                formData.category === "Fuel"
                    ? quantity
                    : 0,
            amount,
            odometer:
                formData.odometer === ""
                    ? null
                    : odometer,
            description: formData.description.trim(),
            vendor: formData.vendor.trim(),
        };

        try {
            setSaving(true);

            if (editingExpenseId) {
                await updateExpense(
                    vehicleId,
                    editingExpenseId,
                    expenseData
                );

                alert("Expense updated successfully!");
            } else {
                await addExpense(vehicleId, expenseData);

                alert("Expense added successfully!");
            }

            resetForm();
            await loadExpenses();
        } catch (error) {
            console.error("Save Expense Error:", error);
            alert("Failed to save expense. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    // ==========================================
    // EDIT EXPENSE
    // ==========================================

    const handleEdit = (expense) => {
        setFormData({
            expenseDate: expense.expenseDate || "",
            category: expense.category || "Fuel",
            fuelType: expense.fuelType || "Petrol",
            quantity:
                expense.quantity === undefined ||
                    expense.quantity === null
                    ? ""
                    : String(expense.quantity),
            amount: String(expense.amount ?? ""),
            odometer:
                expense.odometer === undefined ||
                    expense.odometer === null
                    ? ""
                    : String(expense.odometer),
            description: expense.description || "",
            vendor: expense.vendor || "",
        });

        setEditingExpenseId(expense.id);
        setShowForm(true);

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    // ==========================================
    // DELETE EXPENSE
    // ==========================================

    const handleDelete = async (expenseId) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this expense?"
        );

        if (!confirmed) return;

        try {
            await deleteExpense(vehicleId, expenseId);
            await loadExpenses();

            alert("Expense deleted successfully!");
        } catch (error) {
            console.error("Delete Expense Error:", error);
            alert("Failed to delete expense.");
        }
    };

    // ==========================================
    // STATISTICS
    // ==========================================

    const totalExpenses = expenses.reduce(
        (total, expense) =>
            total + (Number(expense.amount) || 0),
        0
    );

    // Fuel expenses
    const fuelExpenses = expenses.filter(
        (expense) => expense.category === "Fuel"
    );

    // Total fuel quantity
    const totalFuel = fuelExpenses.reduce(
        (total, expense) =>
            total + (Number(expense.quantity) || 0),
        0
    );

    // Current month expenses
    const currentMonth = new Date().toISOString().slice(0, 7);

    const monthlyExpenses = expenses
        .filter(
            (expense) =>
                expense.expenseDate?.slice(0, 7) === currentMonth
        )
        .reduce(
            (total, expense) =>
                total + (Number(expense.amount) || 0),
            0
        );

    // Total fuel cost
    const totalFuelCost = fuelExpenses.reduce(
        (total, expense) =>
            total + (Number(expense.amount) || 0),
        0
    );

    // Average fuel price per litre
    const totalFuelQuantity = fuelExpenses.reduce(
        (total, expense) =>
            total + (Number(expense.quantity) || 0),
        0
    );

    const averageFuelPrice =
        totalFuelQuantity > 0
            ? totalFuelCost / totalFuelQuantity
            : 0;

    // ==========================================
    // NEW: DISTANCE & MILEAGE CALCULATIONS
    // ==========================================

    // Expenses with valid odometer readings
    const odometerReadings = expenses
        .filter(
            (expense) =>
                expense.odometer !== null &&
                expense.odometer !== undefined &&
                expense.odometer !== "" &&
                Number.isFinite(Number(expense.odometer)) &&
                Number(expense.odometer) >= 0
        )
        .map((expense) => ({
            odometer: Number(expense.odometer),
            date: expense.expenseDate || "",
        }))
        .sort((a, b) => a.odometer - b.odometer);

    // Total recorded distance
    const lowestOdometer =
        odometerReadings.length > 0
            ? odometerReadings[0].odometer
            : null;

    const highestOdometer =
        odometerReadings.length > 0
            ? odometerReadings[odometerReadings.length - 1].odometer
            : null;

    const totalDistance =
        odometerReadings.length >= 2 &&
            highestOdometer > lowestOdometer
            ? highestOdometer - lowestOdometer
            : null;

    // Estimate mileage using consecutive fuel records
    const fuelRecordsWithOdometer = fuelExpenses
        .filter(
            (expense) =>
                expense.odometer !== null &&
                expense.odometer !== undefined &&
                expense.odometer !== "" &&
                Number.isFinite(Number(expense.odometer)) &&
                Number(expense.odometer) >= 0 &&
                Number(expense.quantity) > 0
        )
        .sort(
            (a, b) =>
                Number(a.odometer) - Number(b.odometer)
        );

    let mileageDistance = 0;
    let mileageFuelQuantity = 0;
    let mileageFuelCost = 0;

    for (
        let i = 1;
        i < fuelRecordsWithOdometer.length;
        i++
    ) {
        const previous = fuelRecordsWithOdometer[i - 1];
        const current = fuelRecordsWithOdometer[i];

        const distance =
            Number(current.odometer) -
            Number(previous.odometer);

        // Avoid duplicate or decreasing odometer readings
        if (distance <= 0) continue;

        // Only compare the same fuel type
        if (
            (previous.fuelType || "Petrol") !==
            (current.fuelType || "Petrol")
        ) {
            continue;
        }

        mileageDistance += distance;

        // Approximation: assumes consecutive full-tank refills
        mileageFuelQuantity += Number(current.quantity);

        mileageFuelCost += Number(current.amount) || 0;
    }

    const estimatedMileage =
        mileageFuelQuantity > 0 && mileageDistance > 0
            ? mileageDistance / mileageFuelQuantity
            : null;

    const fuelCostPerKm =
        mileageDistance > 0
            ? mileageFuelCost / mileageDistance
            : null;

    // Maintenance and repair expenses
    const maintenanceExpenses = expenses
        .filter((expense) =>
            ["Maintenance", "Repair", "Spare Parts"].includes(
                expense.category
            )
        )
        .reduce(
            (total, expense) =>
                total + (Number(expense.amount) || 0),
            0
        );

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
                        onClick={() => navigate(`/vehicle/${vehicleId}`)}
                        className="mb-5 text-blue-600 hover:text-blue-800 font-semibold"
                    >
                        ← Back to Vehicle
                    </button>

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                ⛽ Fuel & Expenses
                            </h1>

                            <p className="text-gray-500 mt-2">
                                Track fuel purchases and vehicle expenses.
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
                                : "➕ Add Expense"}
                        </button>

                    </div>
                    {/* STATISTICS */}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">

                        {/* TOTAL EXPENSES */}
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
                            <p className="text-sm text-blue-700">Total Expenses</p>
                            <h2 className="text-2xl font-bold text-blue-900 mt-2">
                                NPR {totalExpenses.toLocaleString("en-IN", {
                                    maximumFractionDigits: 2,
                                })}
                            </h2>
                            <p className="text-xs text-gray-500 mt-2">
                                All recorded expenses
                            </p>
                        </div>

                        {/* TOTAL FUEL */}
                        <div className="bg-green-50 border border-green-100 rounded-xl p-5">
                            <p className="text-sm text-green-700">Total Fuel</p>
                            <h2 className="text-2xl font-bold text-green-900 mt-2">
                                {totalFuel.toLocaleString("en-IN", {
                                    maximumFractionDigits: 2,
                                })} L
                            </h2>
                            <p className="text-xs text-gray-500 mt-2">
                                Total recorded quantity
                            </p>
                        </div>

                        {/* THIS MONTH */}
                        <div className="bg-purple-50 border border-purple-100 rounded-xl p-5">
                            <p className="text-sm text-purple-700">This Month</p>
                            <h2 className="text-2xl font-bold text-purple-900 mt-2">
                                NPR {monthlyExpenses.toLocaleString("en-IN", {
                                    maximumFractionDigits: 2,
                                })}
                            </h2>
                            <p className="text-xs text-gray-500 mt-2">
                                Expenses this month
                            </p>
                        </div>

                        {/* AVERAGE FUEL PRICE */}
                        <div className="bg-orange-50 border border-orange-100 rounded-xl p-5">
                            <p className="text-sm text-orange-700">Average Fuel Price</p>
                            <h2 className="text-2xl font-bold text-orange-900 mt-2">
                                NPR {averageFuelPrice.toLocaleString("en-IN", {
                                    maximumFractionDigits: 2,
                                })}/L
                            </h2>
                            <p className="text-xs text-gray-500 mt-2">
                                Average cost per litre
                            </p>
                        </div>

                        {/* TOTAL DISTANCE */}
                        <div className="bg-cyan-50 border border-cyan-100 rounded-xl p-5">
                            <p className="text-sm text-cyan-700">Recorded Distance</p>
                            <h2 className="text-2xl font-bold text-cyan-900 mt-2">
                                {totalDistance !== null
                                    ? `${totalDistance.toLocaleString("en-IN")} km`
                                    : "—"}
                            </h2>
                            <p className="text-xs text-gray-500 mt-2">
                                Based on odometer readings
                            </p>
                        </div>

                        {/* FUEL MILEAGE */}
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5">
                            <p className="text-sm text-emerald-700">Estimated Mileage</p>
                            <h2 className="text-2xl font-bold text-emerald-900 mt-2">
                                {estimatedMileage !== null
                                    ? `${estimatedMileage.toLocaleString("en-IN", {
                                        maximumFractionDigits: 2,
                                    })} km/L`
                                    : "—"}
                            </h2>
                            <p className="text-xs text-gray-500 mt-2">
                                Estimate from fuel records
                            </p>
                        </div>

                        {/* FUEL COST PER KM */}
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
                            <p className="text-sm text-amber-700">Fuel Cost per KM</p>
                            <h2 className="text-2xl font-bold text-amber-900 mt-2">
                                {fuelCostPerKm !== null
                                    ? `NPR ${fuelCostPerKm.toLocaleString("en-IN", {
                                        maximumFractionDigits: 2,
                                    })}`
                                    : "—"}
                            </h2>
                            <p className="text-xs text-gray-500 mt-2">
                                Estimated fuel cost per kilometre
                            </p>
                        </div>

                        {/* MAINTENANCE COST */}
                        <div className="bg-rose-50 border border-rose-100 rounded-xl p-5">
                            <p className="text-sm text-rose-700">Maintenance & Repairs</p>
                            <h2 className="text-2xl font-bold text-rose-900 mt-2">
                                NPR {maintenanceExpenses.toLocaleString("en-IN", {
                                    maximumFractionDigits: 2,
                                })}
                            </h2>
                            <p className="text-xs text-gray-500 mt-2">
                                Maintenance, repairs and spare parts
                            </p>
                        </div>

                    </div>

                    {/* EXPENSE FORM */}

                    {/* EXPENSE ANALYTICS */}

                    <ExpenseAnalytics expenses={expenses} />

                    {/* EXPENSE FORM */}

                    {showForm && (
                        <form
                            ref={formRef}
                            onSubmit={handleSubmit}
                            className="mt-8 bg-slate-50 border rounded-2xl p-6 scroll-mt-6"
                        >

                            <h2 className="text-xl font-bold mb-5">
                                {editingExpenseId
                                    ? "✏️ Edit Expense"
                                    : "➕ Add Expense"}
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

                                {/* DATE */}

                                <div>
                                    <label className="block text-sm font-semibold mb-2">
                                        Expense Date *
                                    </label>

                                    <input
                                        type="date"
                                        name="expenseDate"
                                        value={formData.expenseDate}
                                        onChange={handleChange}
                                        required
                                        className="w-full border rounded-xl px-4 py-3 bg-white"
                                    />
                                </div>

                                {/* CATEGORY */}

                                <div>
                                    <label className="block text-sm font-semibold mb-2">
                                        Expense Type *
                                    </label>

                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        className="w-full border rounded-xl px-4 py-3 bg-white"
                                    >
                                        <option value="Fuel">Fuel</option>
                                        <option value="Maintenance">Maintenance</option>
                                        <option value="Repair">Repair</option>
                                        <option value="Spare Parts">Spare Parts</option>
                                        <option value="Insurance">Insurance</option>
                                        <option value="Tax">Tax</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                {/* FUEL TYPE */}

                                {formData.category === "Fuel" && (
                                    <div>
                                        <label className="block text-sm font-semibold mb-2">
                                            Fuel Type *
                                        </label>

                                        <select
                                            name="fuelType"
                                            value={formData.fuelType}
                                            onChange={handleChange}
                                            className="w-full border rounded-xl px-4 py-3 bg-white"
                                        >
                                            <option value="Petrol">Petrol</option>
                                            <option value="Diesel">Diesel</option>
                                            <option value="Electricity">Electricity</option>
                                            <option value="CNG">CNG</option>
                                            <option value="LPG">LPG</option>
                                        </select>
                                    </div>
                                )}

                                {/* QUANTITY */}

                                {formData.category === "Fuel" && (
                                    <div>
                                        <label className="block text-sm font-semibold mb-2">
                                            Quantity (Litres / Units) *
                                        </label>

                                        <input
                                            type="number"
                                            name="quantity"
                                            value={formData.quantity}
                                            onChange={handleChange}
                                            min="0.01"
                                            step="any"
                                            required
                                            placeholder="e.g. 10"
                                            className="w-full border rounded-xl px-4 py-3 bg-white"
                                        />
                                    </div>
                                )}

                                {/* AMOUNT */}

                                <div>
                                    <label className="block text-sm font-semibold mb-2">
                                        Total Amount (NPR) *
                                    </label>

                                    <input
                                        type="number"
                                        name="amount"
                                        value={formData.amount}
                                        onChange={handleChange}
                                        min="0"
                                        step="any"
                                        required
                                        placeholder="e.g. 1500"
                                        className="w-full border rounded-xl px-4 py-3 bg-white"
                                    />
                                </div>

                                {/* ODOMETER */}

                                <div>
                                    <label className="block text-sm font-semibold mb-2">
                                        Odometer (KM)
                                    </label>

                                    <input
                                        type="number"
                                        name="odometer"
                                        value={formData.odometer}
                                        onChange={handleChange}
                                        min="0"
                                        step="any"
                                        placeholder="e.g. 48250"
                                        className="w-full border rounded-xl px-4 py-3 bg-white"
                                    />
                                </div>

                                {/* VENDOR */}

                                <div>
                                    <label className="block text-sm font-semibold mb-2">
                                        Fuel Station / Garage
                                    </label>

                                    <input
                                        type="text"
                                        name="vendor"
                                        value={formData.vendor}
                                        onChange={handleChange}
                                        placeholder="Enter station or garage"
                                        className="w-full border rounded-xl px-4 py-3 bg-white"
                                    />
                                </div>

                            </div>

                            {/* DESCRIPTION */}

                            <div className="mt-5">
                                <label className="block text-sm font-semibold mb-2">
                                    Description / Notes
                                </label>

                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows="3"
                                    placeholder="Enter additional details..."
                                    className="w-full border rounded-xl px-4 py-3 bg-white"
                                />
                            </div>

                            {/* FORM BUTTONS */}

                            <div className="flex flex-wrap gap-3 mt-6">

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-6 py-3 rounded-xl font-semibold"
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingExpenseId
                                            ? "💾 Update Expense"
                                            : "💾 Save Expense"}
                                </button>

                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-xl font-semibold"
                                >
                                    Cancel
                                </button>

                            </div>

                        </form>
                    )}

                </div>

                {/* EXPENSE HISTORY */}

                <div className="bg-white rounded-2xl shadow-sm mt-6 p-5 md:p-7">

                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-2xl font-bold">
                            Expense History
                        </h2>

                        <span className="text-sm text-gray-500">
                            {expenses.length} records
                        </span>
                    </div>

                    {expenses.length === 0 ? (

                        <div className="text-center py-12 border border-dashed rounded-xl">
                            <div className="text-5xl">⛽</div>

                            <h3 className="font-bold text-lg mt-4">
                                No Expenses Yet
                            </h3>

                            <p className="text-gray-500 text-sm mt-2">
                                Add your first fuel purchase or vehicle expense.
                            </p>
                        </div>

                    ) : (

                        <div className="border rounded-xl overflow-hidden">

                            {expenses.map((expense, index) => (

                                <div
                                    key={expense.id}
                                    className={`p-4 hover:bg-slate-50 ${index !== expenses.length - 1
                                        ? "border-b"
                                        : ""
                                        }`}
                                >

                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">

                                        <div className="flex-1 min-w-0">

                                            <div className="flex flex-wrap items-center gap-2">

                                                <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-bold">
                                                    {expense.category}
                                                </span>

                                                <h3 className="font-bold text-gray-900">
                                                    {expense.category === "Fuel"
                                                        ? `⛽ ${expense.fuelType || "Fuel"}`
                                                        : `🚗 ${expense.category}`}
                                                </h3>

                                            </div>

                                            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-500 mt-2">

                                                <span>
                                                    📅 {expense.expenseDate}
                                                </span>

                                                {expense.category === "Fuel" && (
                                                    <span>
                                                        🛢️ {Number(expense.quantity || 0).toLocaleString("en-IN")} L
                                                    </span>
                                                )}

                                                {expense.odometer !== null &&
                                                    expense.odometer !== undefined && (
                                                        <span>
                                                            🛣️ {Number(expense.odometer).toLocaleString("en-IN")} km
                                                        </span>
                                                    )}

                                                {expense.vendor && (
                                                    <span>
                                                        🏪 {expense.vendor}
                                                    </span>
                                                )}

                                            </div>

                                            {expense.description && (
                                                <p className="text-sm text-gray-600 mt-2 break-words">
                                                    {expense.description}
                                                </p>
                                            )}

                                        </div>

                                        <div className="flex items-center flex-wrap gap-2">

                                            <span className="font-bold text-green-700 mr-2">
                                                NPR {Number(expense.amount || 0).toLocaleString("en-IN")}
                                            </span>

                                            <button
                                                type="button"
                                                onClick={() => handleEdit(expense)}
                                                className="px-3 py-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 text-sm font-semibold"
                                            >
                                                ✏️ Edit
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleDelete(expense.id)}
                                                className="px-3 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 text-sm font-semibold"
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

            </div>
        </div>
    );
}

export default FuelExpenses;