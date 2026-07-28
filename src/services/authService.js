import { auth, db } from "../firebase/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

// Register User
// Register User
export const registerUser = async (fullName, email, password) => {
  // Create account in Firebase Authentication
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  // Get the newly created user
  const user = userCredential.user;

  // Save user profile in Firestore
  await setDoc(doc(db, "users", user.uid), {
    fullName,
    email,
    role: "user",
    verified: false,
    vehicleCount: 0,
    createdAt: serverTimestamp(),
  });

  return userCredential;
};

// Login User
export const loginUser = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

// Logout User
export const logoutUser = () => {
  return signOut(auth);
};