import LoadingSpinner from "../components/LoadingSpinner";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { saveTax, getTax } from "../services/taxService";

function Tax() {
  const { vehicleId } = useParams();

  const [vehicle, setVehicle] = useState(null);
  const [tax, setTax] = useState(null);
  const navigate = useNavigate();

  const [receiptNumber, setReceiptNumber] = useState("");
  const [paidUntil, setPaidUntil] = useState("");

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const user = auth.currentUser;

        if (!user) return;

        const docRef = doc(
          db,
          "vehicles",
          vehicleId
        );

        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setVehicle(docSnap.data());
        }
      } catch (error) {
        console.error(error);
      }
    };

    const fetchTax = async () => {
      try {
        const data = await getTax(vehicleId);

        if (data) {
          setTax(data);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchVehicle();
    fetchTax();
  }, [vehicleId]);

  // Automatic status calculation
  const taxStatus =
    tax && new Date(tax.paidUntil) >= new Date()
      ? "Active"
      : "Expired";

  const handleSubmit = async () => {
    if (!receiptNumber.trim() || !paidUntil) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      await saveTax(vehicleId, {
        receiptNumber,
        paidUntil,
        status: "Active",
      });

      setTax({
        receiptNumber,
        paidUntil,
        status: "Active",
      });

      alert("Vehicle tax submitted successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to save tax.");
    }
  };

  if (!vehicle) {
    return <LoadingSpinner />;
  }

    return (
      <div className="min-h-screen bg-slate-100 p-8">

        <button
          onClick={() => navigate(-1)}
          className="mb-6 bg-white border px-4 py-2 rounded-xl hover:bg-slate-100 transition"
      >
        ← Back to Vehicle Details
      </button>
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8">

        <h1 className="text-3xl font-bold text-center">
          💰 Vehicle Tax
        </h1>

        {/* Vehicle Card */}

        <div className="bg-slate-100 rounded-xl p-5 mt-6 text-center">

          <h2 className="text-xl font-bold">
            🚗 {vehicle.brand} {vehicle.model}
          </h2>

          <p className="text-gray-600 mt-2">
            {vehicle.vehicleNumber}
          </p>

        </div>

        {tax ? (

          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mt-8">

            <h2 className="text-2xl font-bold mb-4">
              💰 Vehicle Tax Details
            </h2>

            <p>
              <strong>Receipt Number:</strong> {tax.receiptNumber}
            </p>

            <p className="mt-3">
              <strong>Paid Until:</strong> {tax.paidUntil}
            </p>

            <p className="mt-4">
              <strong>Status:</strong>

              <span
                className={`ml-2 px-3 py-1 rounded-full ${
                  taxStatus === "Active"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {taxStatus === "Active"
                  ? "🟢 Active"
                  : "🔴 Expired"}
              </span>
            </p>

            <button
              className="mt-6 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg"
            >
              Request Correction
            </button>

          </div>

        ) : (

          <div className="mt-8 space-y-5">

            <div>

              <label className="font-semibold">
                Tax Receipt Number
              </label>

              <input
                type="text"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                placeholder="Enter receipt number"
                className="w-full border rounded-lg p-3 mt-2"
              />

            </div>

            <div>

              <label className="font-semibold">
                Tax Paid Until
              </label>

              <input
                type="date"
                value={paidUntil}
                onChange={(e) => setPaidUntil(e.target.value)}
                className="w-full border rounded-lg p-3 mt-2"
              />

            </div>

            <button
              onClick={handleSubmit}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-xl"
            >
              Submit Vehicle Tax
            </button>

          </div>

        )}

      </div>
    </div>
  );
}

export default Tax;