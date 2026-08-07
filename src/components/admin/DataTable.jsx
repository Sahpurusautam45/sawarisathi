import { Link } from "react-router-dom";

function DataTable({
  title,
  subtitle,
  columns,
  data,
  reviewPath = "/admin/review",
}) {
  return (
    <div className="bg-white rounded-2xl shadow-md mt-8 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold">{title}</h2>

        {subtitle && (
          <p className="text-gray-500 text-sm mt-1">
            {subtitle}
          </p>
        )}
      </div>

      {/* Table */}
      <table className="w-full">
        <thead className="bg-gray-100">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="text-left p-4"
              >
                {column.label}
              </th>
            ))}

            <th className="text-left p-4">
              Action
            </th>
          </tr>
        </thead>

        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + 1}
                className="text-center py-8 text-gray-500"
              >
                No records found.
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr
                key={item.id}
                className="border-t"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="p-4"
                  >
                    {item[column.key]}
                  </td>
                ))}

                <td className="p-4">
                  <Link
                    to={`${reviewPath}/${item.id}`}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Review
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;