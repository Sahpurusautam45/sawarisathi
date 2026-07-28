import ProtectedRoute from "./components/ProtectedRoute";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import { Routes, Route } from "react-router-dom";
import VehicleDetails from "./pages/VehicleDetails";

import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import About from "./pages/About";
import Services from "./pages/Services";
import Login from "./pages/Login";
import VehicleLookup from "./pages/VehicleLookup";

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
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
        }
      />
        <Route
          path="/vehicle/:vehicleNumber"
          element={<VehicleDetails />}
        />
      </Routes>
    </>
  );
}

export default App;