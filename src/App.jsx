import NotFound from "./pages/NotFound";
import Bluebook from "./pages/Bluebook";
import Tax from "./pages/Tax";
import ProtectedRoute from "./components/ProtectedRoute";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import { Routes, Route } from "react-router-dom";
import VehicleDetails from "./pages/VehicleDetails";

import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import About from "./pages/About";
import Services from "./pages/Services";
import VehicleLookup from "./pages/VehicleLookup";
import AddVehicle from "./pages/AddVehicle";
import VehicleForm from "./pages/VehicleForm";
import Insurance from "./pages/Insurance";

import AdminDashboard from "./admin/AdminDashboard";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import VehicleVerification from "./admin/VehicleVerification";
import Users from "./admin/Users";
import Reports from "./admin/Reports";
import Settings from "./admin/Settings";
import VehicleReview from "./admin/VehicleReview";

function App() {
  return (
    <>
      <Navbar />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/vehicle-lookup" element={<VehicleLookup />} />

        {/* User Protected Routes */}
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

        {/* Admin Routes */}
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

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;