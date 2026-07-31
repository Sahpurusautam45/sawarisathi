import {
  saveInsurance,
  getInsurance,
} from "../services/insuranceService";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import insuranceCompanies from "../data/insuranceCompanies";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";

function Insurance() {
  const [category, setCategory] = useState("");
  const [company, setCompany] = useState("");
  const { vehicleId } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [insurance, setInsurance] = useState(null);
  const [otherCompany, setOtherCompany] = useState("");
  const [policyNumber, setPolicyNumber] = useState("");
  const [validUntil, setValidUntil] = useState("");

  useEffect(() => {
  const fetchVehicle = async () => {
    try {
      const user = auth.currentUser;

      if (!user) return;

      const docRef = doc(
        db,
        "users",
        user.uid,
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

  fetchVehicle();
  const fetchInsurance = async () => {
  try {
    const data = await getInsurance(vehicleId);

    if (data) {
      setInsurance(data);
    }
  } catch (error) {
    console.error(error);
  }
};

fetchInsurance();
}, [vehicleId]);

  const companies =
    category === "general"
      ? insuranceCompanies.general
      : category === "micro"
      ? insuranceCompanies.micro
      : [];
      const handleSubmit = async () => {
  if (!category || !company || !policyNumber || !validUntil) {
    alert("Please fill all required fields.");
    return;
  }

  try {
    await saveInsurance(vehicleId, {
      category,
      company:
        company === "Other"
          ? otherCompany
          : company,
      policyNumber,
      validUntil,
    });

    alert("Insurance submitted successfully!");
    setInsurance({
      category,
      company: company === "Other" ? otherCompany : company,
      policyNumber,
      validUntil,
      status: "Pending Verification",
    });
  } catch (error) {
    console.error(error);
    alert("Failed to save insurance.");
  }
};

  return (
    <div className="min-h-screen bg-slate-100 p-8">

      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8">

        <h1 className="text-3xl font-bold text-center">
          🛡 Insurance
        </h1>

        {vehicle && (

         <div className="bg-slate-100 rounded-xl p-5 mt-6 text-center">

           <h2 className="text-xl font-bold">
             🚗 {vehicle.brand} {vehicle.model}
            </h2>

            <p className="text-gray-600 mt-2">
              {vehicle.vehicleNumber}
            </p>

        </div>

    )}
      
      {insurance ? (

  <div className="bg-green-50 border border-green-200 rounded-xl p-6 mt-8">

    <h2 className="text-2xl font-bold mb-4">
      🛡 Insurance Details
    </h2>

    <p><strong>Category:</strong> {insurance.category}</p>

    <p><strong>Company:</strong> {insurance.company}</p>

    <p><strong>Policy Number:</strong> {insurance.policyNumber}</p>

    <p><strong>Valid Until:</strong> {insurance.validUntil}</p>

    <p className="mt-4">
      <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full">
        🟡 {insurance.status}
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

          {/* Insurance Category */}

          <div>

            <label className="font-semibold">
              Insurance Category
            </label>

            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setCompany("");
              }}
              className="w-full border rounded-lg p-3 mt-2"
            >
              <option value="">
                Select Insurance Category
              </option>

              <option value="general">
                General Non-Life Insurance
              </option>

              <option value="micro">
                Micro Non-Life Insurance
              </option>

            </select>

          </div>

          {/* Company */}

          <div>

            <label className="font-semibold">
              Insurance Company
            </label>

            <select
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full border rounded-lg p-3 mt-2"
              disabled={!category}
            >
              <option value="">
                Select Insurance Company
              </option>

              {companies.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}

            </select>

          </div>

          {/* Other Company */}

          {company === "Other" && (

            <div>

              <label className="font-semibold">
                Insurance Company Name
              </label>

            <input
              type="text"
              value={otherCompany}
              onChange={(e) => setOtherCompany(e.target.value)}
              placeholder="Enter company name"
              className="w-full border rounded-lg p-3 mt-2"
            />

            </div>

          )}

          {/* Policy Number */}

          <div>

            <label className="font-semibold">
              Policy Number
            </label>

          <input
            type="text"
            value={policyNumber}
            onChange={(e) => setPolicyNumber(e.target.value)}
            placeholder="Enter policy number"
            className="w-full border rounded-lg p-3 mt-2"
          />

          </div>

          {/* Valid Until */}

          <div>

            <label className="font-semibold">
              Insurance Valid Until
            </label>

          <input
            type="date"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            className="w-full border rounded-lg p-3 mt-2"
          />

          </div>

          <button
  onClick={handleSubmit}
  className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-xl"
>
  Submit Insurance
</button>

</div>

)} 

</div>

</div>
);
}

export default Insurance;