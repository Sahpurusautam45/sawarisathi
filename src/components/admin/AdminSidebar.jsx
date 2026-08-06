import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Car,
  Users,
  FileText,
  Settings,
  LogOut,
} from "lucide-react";

function AdminSidebar() {
  const location = useLocation();

  const menu = [
    {
      name: "Dashboard",
      path: "/admin",
      icon: <LayoutDashboard size={20} />,
    },
    {
      name: "Vehicle Verification",
      path: "/admin/review",
      icon: <Car size={20} />,
    },
    {
      name: "Users",
      path: "/admin/users",
      icon: <Users size={20} />,
    },
    {
      name: "Reports",
      path: "/admin/reports",
      icon: <FileText size={20} />,
    },
    {
      name: "Settings",
      path: "/admin/settings",
      icon: <Settings size={20} />,
    },
  ];

  return (
    <aside className="w-72 bg-slate-900 text-white min-h-screen">

      <div className="text-2xl font-bold p-6 border-b border-slate-700">
        🚗 SawariSathi
      </div>

      <nav className="mt-5">

        {menu.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={`flex items-center gap-3 px-6 py-4 transition

            ${
              location.pathname === item.path
                ? "bg-blue-600"
                : "hover:bg-slate-800"
            }`}
          >
            {item.icon}

            {item.name}
          </Link>
        ))}

      </nav>

      <div className="absolute bottom-0 w-72 border-t border-slate-700">

        <button className="flex items-center gap-3 px-6 py-5 w-full hover:bg-red-600 transition">

          <LogOut size={20} />

          Logout

        </button>

      </div>

    </aside>
  );
}

export default AdminSidebar;