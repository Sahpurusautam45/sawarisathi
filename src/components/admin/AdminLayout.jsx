import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";

function AdminLayout({ children }) {
  return (
    <div className="flex bg-slate-100 min-h-screen">
      <AdminSidebar />

      <main className="flex-1 p-8">
        <AdminTopbar />

        {children}
      </main>
    </div>
  );
}

export default AdminLayout;