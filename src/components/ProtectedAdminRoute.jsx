import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../firebase/firebase";
import LoadingSpinner from "./LoadingSpinner";

function ProtectedAdminRoute({ children }) {
  const [user, loading] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(null);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      try {
        const userRef = doc(
          db,
          "users",
          user.uid
        );

        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
          console.log("Admin check: user document not found.");
          setIsAdmin(false);
          return;
        }

        const userData = userDoc.data();

        console.log("Admin check:", {
          uid: user.uid,
          email: user.email,
          role: userData.role,
        });

        setIsAdmin(userData.role === "admin");

      } catch (error) {
        console.error(
          "Admin authentication error:",
          error
        );

        setIsAdmin(false);
      }
    };

    if (!loading) {
      checkAdmin();
    }
  }, [user, loading]);

  // Firebase authentication still loading
  if (loading || isAdmin === null) {
    return <LoadingSpinner />;
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but not admin
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Admin successfully authenticated
  return children;
}

export default ProtectedAdminRoute;