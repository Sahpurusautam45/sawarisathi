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

function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/about" element={<About />} />

        <Route path="/services" element={<Services />} />

        <Route path="/login" element={<Auth />} />

        <Route path="/vehicle-lookup" element={<VehicleLookup />} />

        <Route path="*" element={<NotFound />} />

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
        <Route
          path="/admin"
          element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
        }
      />
      </Routes>
    </>
  );
}

export default App;
