import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth } from "../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { logoutUser } from "../services/authService";
import { useLanguage } from "../context/LanguageContext";

function Navbar() {
  const [user, setUser] = useState(null);

  const { language, toggleLanguage, t } = useLanguage();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
      }
    );

    return () => unsubscribe();
  }, []);

  // ==============================
  // Logout Function
  // ==============================
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

        {/* ==============================
            Logo
        ============================== */}

        <div className="flex items-center gap-2">
          <span className="text-3xl">🚗</span>

          <h1 className="text-2xl font-bold">
            SawariSathi
          </h1>
        </div>


        {/* ==============================
            Navigation Links
        ============================== */}

        <ul className="flex items-center gap-8 font-medium">

          {/* ==============================
              LANGUAGE SWITCH
          ============================== */}

          <li>

            <button
              onClick={toggleLanguage}
              className="relative w-32 h-10 rounded-full bg-white/20 border border-white/30 overflow-hidden transition-all duration-300 focus:outline-none"
              aria-label="Switch language"
            >

              {/* Sliding Background */}

              <span
                className={`absolute top-1 left-1 w-[60px] h-8 bg-white rounded-full shadow-md transition-transform duration-300 ${
                  language === "ne"
                    ? "translate-x-[60px]"
                    : "translate-x-0"
                }`}
              />

              {/* Language Labels */}

              <span className="relative z-10 flex items-center justify-between h-full px-2 text-sm font-bold">

                <span
                  className={
                    language === "en"
                      ? "text-blue-700"
                      : "text-white"
                  }
                >
                  🇬🇧 EN
                </span>

                <span
                  className={
                    language === "ne"
                      ? "text-blue-700"
                      : "text-white"
                  }
                >
                  🇳🇵 ने
                </span>

              </span>

            </button>

          </li>


          {/* ==============================
              HOME
          ============================== */}

          <li>
            <Link
              to="/"
              className="hover:text-yellow-300 transition duration-300"
            >
              {t("home")}
            </Link>
          </li>


          {/* ==============================
              VEHICLE LOOKUP
          ============================== */}

          <li>
            <Link
              to="/vehicle-lookup"
              className="hover:text-yellow-300 transition duration-300"
            >
              {t("vehicleLookup")}
            </Link>
          </li>


          {/* ==============================
              SERVICES
          ============================== */}

          <li>
            <Link
              to="/services"
              className="hover:text-yellow-300 transition duration-300"
            >
              {t("services")}
            </Link>
          </li>


          {/* ==============================
              ABOUT
          ============================== */}

          <li>
            <Link
              to="/about"
              className="hover:text-yellow-300 transition duration-300"
            >
              {t("about")}
            </Link>
          </li>


          {/* ==============================
              DASHBOARD
          ============================== */}

          {user && (
            <li>
              <Link
                to="/dashboard"
                className="bg-yellow-400 text-black px-5 py-2 rounded-lg hover:bg-yellow-500 transition duration-300"
              >
                {t("dashboard")}
              </Link>
            </li>
          )}


          {/* ==============================
              LOGIN
          ============================== */}

          {!user && (
            <li>
              <Link
                to="/login"
                className="bg-blue-700 text-white px-5 py-2 rounded-lg hover:bg-blue-800 transition duration-300"
              >
                {t("login")}
              </Link>
            </li>
          )}


          {/* ==============================
              LOGOUT
          ============================== */}

          {user && (
            <li>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 transition duration-300"
              >
                {t("logout")}
              </button>
            </li>
          )}

        </ul>

      </div>

    </nav>
  );
}

export default Navbar;