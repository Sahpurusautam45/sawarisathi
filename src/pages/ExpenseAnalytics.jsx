import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
} from "recharts";

const COLORS = [
    "#2563eb",
    "#16a34a",
    "#f59e0b",
    "#dc2626",
    "#9333ea",
    "#0891b2",
    "#64748b",
];

function ExpenseAnalytics({ expenses = [] }) {
    // ----------------------------------
    // EXPENSE CATEGORY BREAKDOWN
    // ----------------------------------

    const categoryTotals = expenses.reduce((result, expense) => {
        const category = expense.category || "Other";
        const amount = Number(expense.amount) || 0;

        result[category] = (result[category] || 0) + amount;

        return result;
    }, {});

    const categoryData = Object.entries(categoryTotals).map(
        ([name, value]) => ({
            name,
            value,
        })
    );

    // ----------------------------------
    // MONTHLY EXPENSES
    // ----------------------------------

    const monthlyTotals = expenses.reduce((result, expense) => {
        const date = expense.expenseDate;

        if (!date) return result;

        const month = date.slice(0, 7);
        const amount = Number(expense.amount) || 0;

        result[month] = (result[month] || 0) + amount;

        return result;
    }, {});

    const monthlyData = Object.entries(monthlyTotals)
        .sort(([monthA], [monthB]) =>
            monthA.localeCompare(monthB)
        )
        .slice(-6)
        .map(([month, amount]) => {
            const [year, monthNumber] = month.split("-");

            const monthName = new Date(
                Number(year),
                Number(monthNumber) - 1
            ).toLocaleDateString("en-IN", {
                month: "short",
                year: "numeric",
            });

            return {
                month: monthName,
                amount,
            };
        });

    const totalSpent = expenses.reduce(
        (total, expense) =>
            total + (Number(expense.amount) || 0),
        0
    );

    // ----------------------------------
    // UI
    // ----------------------------------

    return (
        <div className="mt-6 space-y-6">

            {/* ANALYTICS HEADER */}

            <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-900">
                    📊 Expense Analytics
                </h2>

                <p className="text-gray-500 mt-2">
                    Understand your vehicle spending.
                </p>

                <div className="mt-5 bg-blue-50 border border-blue-100 rounded-xl p-5">
                    <p className="text-sm text-blue-700">
                        Total Recorded Spending
                    </p>

                    <h3 className="text-3xl font-bold text-blue-900 mt-2">
                        NPR {totalSpent.toLocaleString("en-IN", {
                            maximumFractionDigits: 2,
                        })}
                    </h3>
                </div>
            </div>

            {/* CATEGORY PIE CHART */}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h3 className="text-xl font-bold mb-2">
                        Expense Breakdown
                    </h3>

                    <p className="text-sm text-gray-500 mb-4">
                        Spending by expense category
                    </p>

                    {categoryData.length === 0 ? (
                        <p className="text-center text-gray-500 py-16">
                            No expense data available yet.
                        </p>
                    ) : (
                        <ResponsiveContainer width="100%" height={320}>
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    label={({ name }) => name}
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell
                                            key={entry.name}
                                            fill={COLORS[index % COLORS.length]}
                                        />
                                    ))}
                                </Pie>

                                <Tooltip
                                    formatter={(value) =>
                                        `NPR ${Number(value).toLocaleString("en-IN")}`
                                    }
                                />

                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* MONTHLY BAR CHART */}

                <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h3 className="text-xl font-bold mb-2">
                        Monthly Spending
                    </h3>

                    <p className="text-sm text-gray-500 mb-4">
                        Your six most recent recorded months
                    </p>

                    {monthlyData.length === 0 ? (
                        <p className="text-center text-gray-500 py-16">
                            No monthly expense data available yet.
                        </p>
                    ) : (
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" />

                                <XAxis
                                    dataKey="month"
                                    tick={{ fontSize: 12 }}
                                />

                                <YAxis
                                    tickFormatter={(value) =>
                                        value.toLocaleString("en-IN")
                                    }
                                />

                                <Tooltip
                                    formatter={(value) =>
                                        `NPR ${Number(value).toLocaleString("en-IN")}`
                                    }
                                />

                                <Bar
                                    dataKey="amount"
                                    name="Expenses"
                                    fill="#2563eb"
                                    radius={[6, 6, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

            </div>

        </div>
    );
}

export default ExpenseAnalytics;