import { useNavigate } from "react-router-dom";

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-6">
      <div className="bg-white rounded-2xl shadow-lg p-10 text-center max-w-md w-full">

        <div className="text-7xl mb-4">🚗</div>

        <h1 className="text-4xl font-bold text-gray-800">
          404
        </h1>

        <h2 className="text-2xl font-semibold mt-3">
          Page Not Found
        </h2>

        <p className="text-gray-500 mt-3">
          The page you are looking for doesn't exist or has been moved.
        </p>

        <button
          onClick={() => navigate("/dashboard")}
          className="mt-8 bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-xl"
        >
          🏠 Back to Dashboard
        </button>

      </div>
    </div>
  );
}

export default NotFound;