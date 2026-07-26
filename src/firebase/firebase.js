import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBxbU9gSQtIY2n7xcjXWIsx4Q4yTHCco8U",
  authDomain: "sawarisathi-5b0af.firebaseapp.com",
  projectId: "sawarisathi-5b0af",
  storageBucket: "sawarisathi-5b0af.firebasestorage.app",
  messagingSenderId: "490714424177",
  appId: "1:490714424177:web:01e6266a2e3ae6e54f0cd0",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;