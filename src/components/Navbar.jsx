import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth } from "../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { logoutUser } from "../services/authService";

function Navbar() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  // Logout Function
  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <nav className="bg-blue-700 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-4">

        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="text-3xl">🚗</span>
          <h1 className="text-2xl font-bold">SawariSathi</h1>
        </div>

        {/* Navigation Links */}
        <ul className="flex items-center gap-8 font-medium">

          <li>
            <Link
              to="/"
              className="hover:text-yellow-300 transition duration-300"
            >
              Home
            </Link>
          </li>

          <li>
            <Link
              to="/vehicle-lookup"
              className="hover:text-yellow-300 transition duration-300"
            >
              Vehicle Lookup
            </Link>
          </li>

          <li>
            <Link
              to="/services"
              className="hover:text-yellow-300 transition duration-300"
            >
              Services
            </Link>
          </li>

          <li>
            <Link
              to="/about"
              className="hover:text-yellow-300 transition duration-300"
            >
              About
            </Link>
          </li>

          {user && (
            <li>
              <Link
                to="/dashboard"
                className="bg-yellow-400 text-black px-5 py-2 rounded-lg hover:bg-yellow-500 transition duration-300"
              >
                Dashboard
              </Link>
            </li>
          )}

          {!user && (
            <li>
              <Link
                to="/login"
                className="bg-blue-700 text-white px-5 py-2 rounded-lg hover:bg-blue-800 transition duration-300"
              >
                Login
              </Link>
            </li>
          )}

          {user && (
            <li>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 transition duration-300"
              >
                Logout
              </button>
            </li>
          )}

        </ul>
      </div>
    </nav>
  );
}

export default Navbar;