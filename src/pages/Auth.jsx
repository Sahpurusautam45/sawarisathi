import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser, loginUser } from "../services/authService";

function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
  e.preventDefault();

  setError("");

  if (!isLogin) {
    if (fullName.trim() === "") {
      setError("Please enter your full name.");
      return;
    }

    if (email.trim() === "") {
     setError("Please enter your email.");
     return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }


    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
  }

      try {
       setLoading(true);

       await registerUser(email, password);

       alert("Account created successfully!");

       navigate("/dashboard");

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 p-4">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md">

        <h1 className="text-3xl font-bold text-center text-blue-700">
          🚗 SawariSathi
        </h1>

        <p className="text-center text-gray-500 mt-2">
          Manage your vehicles securely in one place.
        </p>

        {/* Tabs */}
        <div className="flex mt-6 border-b">
          <button
            onClick={() => setIsLogin(true)}
            className={`w-1/2 py-2 font-semibold ${
              isLogin
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500"
            }`}
          >
            Login
          </button>

          <button
            onClick={() => setIsLogin(false)}
            className={`w-1/2 py-2 font-semibold ${
              !isLogin
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500"
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">

          {!isLogin && (
            <input
             type="text"
             placeholder="Full Name"
             value={fullName}
             onChange={(e) => setFullName(e.target.value)}
             className="w-full border rounded-lg p-3"
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-lg p-3"
        />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-lg p-3"
        />
           {!isLogin && (
            <input
             type="password"
             placeholder="Confirm Password"
             value={confirmPassword}
             onChange={(e) => setConfirmPassword(e.target.value)}
             className="w-full border rounded-lg p-3"
        />
          )}
        {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">
            {error}
        </div>
          )}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
          >
            {isLogin ? "Login" : "Create Account"}
          </button>
        </form>

      </div>
    </div>
  );
}

export default Auth;