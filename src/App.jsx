import { Routes, Route } from "react-router-dom";

// Language
import { LanguageProvider } from "./context/LanguageContext";

// Components
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";

// Public Pages
import Home from "./pages/Home";
import About from "./pages/About";
import Services from "./pages/Services";
import Auth from "./pages/Auth";
import VehicleLookup from "./pages/VehicleLookup";
import PublicSearch from "./pages/PublicSearch";
import NotFound from "./pages/NotFound";

// User Pages
import Dashboard from "./pages/Dashboard";
import AddVehicle from "./pages/AddVehicle";
import VehicleForm from "./pages/VehicleForm";
import VehicleDetails from "./pages/VehicleDetails";
import Bluebook from "./pages/Bluebook";
import Insurance from "./pages/Insurance";
import Tax from "./pages/Tax";

// Admin Pages
import AdminDashboard from "./admin/AdminDashboard";
import VehicleVerification from "./admin/VehicleVerification";
import VehicleReports from "./admin/VehicleReports";
import VehicleReportReview from "./admin/VehicleReportReview";
import VehicleReview from "./admin/VehicleReview";
import Users from "./admin/Users";
import Reports from "./admin/Reports";
import Settings from "./admin/Settings";

function App() {
  return (
    <LanguageProvider>

      {/* ==============================
          NAVBAR
      ============================== */}

      <Navbar />


      {/* ==============================
          ROUTES
      ============================== */}

      <Routes>

        {/* ==========================================
            PUBLIC ROUTES
        ========================================== */}

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/about"
          element={<About />}
        />

        <Route
          path="/services"
          element={<Services />}
        />

        <Route
          path="/login"
          element={<Auth />}
        />

        <Route
          path="/vehicle-lookup"
          element={<VehicleLookup />}
        />

        <Route
          path="/search"
          element={<PublicSearch />}
        />


        {/* ==========================================
            USER PROTECTED ROUTES
        ========================================== */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/add-vehicle"
          element={
            <ProtectedRoute>
              <AddVehicle />
            </ProtectedRoute>
          }
        />

        <Route
          path="/add-vehicle/manual"
          element={
            <ProtectedRoute>
              <VehicleForm />
            </ProtectedRoute>
          }
        />

        <Route
          path="/vehicle/:vehicleId"
          element={
            <ProtectedRoute>
              <VehicleDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/vehicle/:vehicleId/insurance"
          element={
            <ProtectedRoute>
              <Insurance />
            </ProtectedRoute>
          }
        />

        <Route
          path="/vehicle/:vehicleId/tax"
          element={
            <ProtectedRoute>
              <Tax />
            </ProtectedRoute>
          }
        />

        <Route
          path="/vehicle/:vehicleId/bluebook"
          element={
            <ProtectedRoute>
              <Bluebook />
            </ProtectedRoute>
          }
        />


        {/* ==========================================
            ADMIN ROUTES
        ========================================== */}

        <Route
          path="/admin"
          element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          }
        />

        <Route
          path="/admin/vehicle-verification"
          element={
            <ProtectedAdminRoute>
              <VehicleVerification />
            </ProtectedAdminRoute>
          }
        />

        <Route
          path="/admin/vehicle-reports"
          element={
            <ProtectedAdminRoute>
              <VehicleReports />
            </ProtectedAdminRoute>
          }
        />

        <Route
          path="/admin/vehicle-reports/:reportId"
          element={
            <ProtectedAdminRoute>
              <VehicleReportReview />
            </ProtectedAdminRoute>
          }
        />

        <Route
          path="/admin/review/:vehicleId"
          element={
            <ProtectedAdminRoute>
              <VehicleReview />
            </ProtectedAdminRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <ProtectedAdminRoute>
              <Users />
            </ProtectedAdminRoute>
          }
        />

        <Route
          path="/admin/reports"
          element={
            <ProtectedAdminRoute>
              <Reports />
            </ProtectedAdminRoute>
          }
        />

        <Route
          path="/admin/settings"
          element={
            <ProtectedAdminRoute>
              <Settings />
            </ProtectedAdminRoute>
          }
        />


        {/* ==========================================
            404
        ========================================== */}

        <Route
          path="*"
          element={<NotFound />}
        />

      </Routes>

    </LanguageProvider>
  );
}

export default App;