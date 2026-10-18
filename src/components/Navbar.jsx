import { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  useLocation,
} from "react-router-dom";

import { auth } from "../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { logoutUser } from "../services/authService";
import { useLanguage } from "../context/LanguageContext";
import UserNotifications from "./UserNotifications";

function Navbar() {
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const { language, toggleLanguage, t } = useLanguage();
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  // Close the mobile menu after navigation.
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent background scrolling while the mobile menu is open.
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await logoutUser();
      setMobileMenuOpen(false);
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoggingOut(false);
    }
  };

  const navLinks = [
    { to: "/", label: t("home"), end: true },
    {
      to: "/vehicle-lookup",
      label: t("vehicleLookup"),
    },
    { to: "/services", label: t("services") },
    { to: "/about", label: t("about") },
  ];

  const linkClass = ({ isActive }) =>
    [
      "relative rounded-lg px-3 py-2 text-sm font-semibold",
      "transition-colors duration-200",
      "focus-visible:outline-none focus-visible:ring-2",
      "focus-visible:ring-blue-500 focus-visible:ring-offset-2",
      isActive
        ? "bg-blue-50 text-blue-700"
        : "text-slate-600 hover:bg-slate-50 hover:text-blue-700",
    ].join(" ");

  const renderLanguageSwitch = () => (
    <button
      type="button"
      onClick={toggleLanguage}
      aria-label="Switch language"
      className="relative flex h-10 w-[112px] shrink-0 items-center rounded-full border border-slate-200 bg-slate-100 p-1 transition hover:border-blue-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <span
        className={[
          "absolute inset-y-1 left-1 w-[52px] rounded-full",
          "bg-white shadow-sm transition-transform duration-300",
          language === "ne" ? "translate-x-[54px]" : "translate-x-0",
        ].join(" ")}
      />

      <span
        className={[
          "relative z-10 flex-1 text-center text-xs font-bold",
          language === "en" ? "text-blue-700" : "text-slate-500",
        ].join(" ")}
      >
        EN
      </span>

      <span
        className={[
          "relative z-10 flex-1 text-center text-xs font-bold",
          language === "ne" ? "text-blue-700" : "text-slate-500",
        ].join(" ")}
      >
        नेपाली
      </span>
    </button>
  );

  const renderNavLinks = (mobile = false) =>
    navLinks.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.end}
        className={({ isActive }) =>
          mobile
            ? [
                "block rounded-xl px-4 py-3 text-sm font-semibold",
                "transition-colors duration-200",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-700 hover:bg-slate-50 hover:text-blue-700",
              ].join(" ")
            : linkClass({ isActive })
        }
      >
        {item.label}
      </NavLink>
    ));

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-md">
      <nav
        className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"
        aria-label="Main navigation"
      >
        {/* BRAND */}
        <Link
          to="/"
          className="group flex shrink-0 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="SawariSathi home"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-2xl shadow-md shadow-blue-600/20 transition-transform duration-200 group-hover:scale-105">
            🚗
          </span>

          <span className="flex flex-col">
            <span className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">
              Sawari<span className="text-blue-600">Sathi</span>
            </span>

            <span className="hidden text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 sm:block">
              Your Vehicle Companion
            </span>
          </span>
        </Link>

        {/* DESKTOP NAVIGATION */}
        <div className="hidden items-center gap-1 lg:flex">
          {renderNavLinks()}
        </div>

        {/* DESKTOP ACTIONS */}
        <div className="hidden shrink-0 items-center gap-3 lg:flex">
          {renderLanguageSwitch()}

          {user && (
            <div className="flex items-center gap-3 border-l border-slate-200 pl-3">
              <UserNotifications />

              <Link
                to="/dashboard"
                className="inline-flex min-h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                {t("dashboard")}
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loggingOut ? "..." : t("logout")}
              </button>
            </div>
          )}

          {!user && (
            <Link
              to="/login"
              className="inline-flex min-h-10 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              {t("login")}
            </Link>
          )}
        </div>

        {/* MOBILE ACTIONS */}
        <div className="flex shrink-0 items-center gap-2 lg:hidden">
          {user && <UserNotifications />}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {mobileMenuOpen ? (
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 6l12 12M18 6L6 18"
                />
              </svg>
            ) : (
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 7h16M4 12h16M4 17h16"
                />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* MOBILE MENU */}
      {mobileMenuOpen && (
        <div
          id="mobile-navigation"
          className="border-t border-slate-200 bg-white shadow-lg lg:hidden"
        >
          <div className="mx-auto max-w-7xl space-y-4 px-4 py-5 sm:px-6">
            <div className="grid grid-cols-1 gap-1">
              {renderNavLinks(true)}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="text-sm font-semibold text-slate-600">
                Language
              </span>

              {renderLanguageSwitch()}
            </div>

            {user ? (
              <div className="grid grid-cols-1 gap-2 border-t border-slate-100 pt-4 sm:grid-cols-2">
                <Link
                  to="/dashboard"
                  className="flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-bold text-white transition hover:bg-blue-700"
                >
                  {t("dashboard")}
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex min-h-11 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-60"
                >
                  {loggingOut ? "..." : t("logout")}
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                {t("login")}
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;