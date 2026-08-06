import LoadingSpinner from "../components/LoadingSpinner";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";

import dotmOffices from "../data/dotmOffices";
import {
  saveBluebook,
  getBluebook,
} from "../services/bluebookService";

function Bluebook() {
  const { vehicleId } = useParams();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState(null);
  const [bluebook, setBluebook] = useState(null);
  
  const [province, setProvince] = useState("");
  const [office, setOffice] = useState("");
  const [bluebookNumber, setBluebookNumber] = useState("");
  const [registrationDate, setRegistrationDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

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

    const fetchBluebook = async () => {
      try {
        const data = await getBluebook(vehicleId);

        if (data) {
          setBluebook(data);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchVehicle();
    fetchBluebook();
  }, [vehicleId]);

  const selectedProvince = dotmOffices.find(
    (item) => item.province_id === province
  );

  const offices = selectedProvince
    ? selectedProvince.offices
    : [];

  const handleSubmit = async () => {
    if (
      !province ||
      !office ||
      !bluebookNumber.trim() ||
      !registrationDate ||
      !expiryDate
    ) {
      alert("Please fill all fields.");
      return;
    }

    try {
      await saveBluebook(vehicleId, {
        provinceId: province,
        officeId: office,
        bluebookNumber,
        registrationDate,
        expiryDate,
      });

      setBluebook({
        provinceId: province,
        officeId: office,
        bluebookNumber,
        registrationDate,
        expiryDate,
      });

      alert("Bluebook submitted successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to save Bluebook.");
    }
  };

  if (!vehicle) {
    return <LoadingSpinner />;
  }

  return (
    
    <div className="min-h-screen bg-slate-100 p-8">
      <button
        onClick={() => navigate(`/vehicle/${vehicleId}`)}
        className="mb-6 bg-white border px-4 py-2 rounded-xl hover:bg-slate-100 transition"
      >
        ← Back to Vehicle Details
      </button>
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8">

        <h1 className="text-3xl font-bold text-center">
          📘 Vehicle Bluebook
        </h1>

        <div className="bg-slate-100 rounded-xl p-5 mt-6 text-center">

          <h2 className="text-xl font-bold">
            🚗 {vehicle.brand} {vehicle.model}
          </h2>

          <p className="text-gray-600 mt-2">
            {vehicle.vehicleNumber}
          </p>

        </div>

        {bluebook ? (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-6 mt-8">

            <h2 className="text-2xl font-bold mb-4">
              📘 Bluebook Details
            </h2>

            <p>
              <strong>Province:</strong>{" "}
              {
                dotmOffices.find(
                  (p) => p.province_id === bluebook.provinceId
                )?.province_name
              }
            </p>

            <p className="mt-3">
              <strong>Transport Office:</strong>{" "}
              {
                dotmOffices
                  .find((p) => p.province_id === bluebook.provinceId)
                  ?.offices.find(
                    (o) => o.office_id === bluebook.officeId
                  )?.office_name
              }
            </p>

            <p className="mt-3">
              <strong>Bluebook Number:</strong>{" "}
              {bluebook.bluebookNumber}
            </p>

            <p className="mt-3">
              <strong>Registration Date:</strong>{" "}
              {bluebook.registrationDate}
            </p>

            <p className="mt-3">
              <strong>Bluebook Expiry:</strong>{" "}
              {bluebook.expiryDate}
            </p>

          </div>

        ) : (

          <div className="mt-8 space-y-5">

            <div>
              <label className="font-semibold">
                Province
              </label>

              <select
                value={province}
                onChange={(e) => {
                  setProvince(e.target.value);
                  setOffice("");
                }}
                className="w-full border rounded-lg p-3 mt-2"
              >
                <option value="">
                  Select Province
                </option>

                {dotmOffices.map((item) => (
                  <option
                    key={item.province_id}
                    value={item.province_id}
                  >
                    {item.province_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold">
                Transport Office
              </label>

              <select
                value={office}
                onChange={(e) =>
                  setOffice(e.target.value)
                }
                disabled={!province}
                className="w-full border rounded-lg p-3 mt-2"
              >
                <option value="">
                  Select Transport Office
                </option>

                {offices.map((item) => (
                  <option
                    key={item.office_id}
                    value={item.office_id}
                  >
                    {item.office_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold">
                Bluebook Number
              </label>

              <input
                type="text"
                value={bluebookNumber}
                onChange={(e) =>
                  setBluebookNumber(e.target.value)
                }
                placeholder="Enter Bluebook Number"
                className="w-full border rounded-lg p-3 mt-2"
              />
            </div>

            <div>
              <label className="font-semibold">
                Registration Date
              </label>

              <input
                type="date"
                value={registrationDate}
                onChange={(e) =>
                  setRegistrationDate(e.target.value)
                }
                className="w-full border rounded-lg p-3 mt-2"
              />
            </div>

            <div>
              <label className="font-semibold">
                Bluebook Expiry
              </label>

              <input
                type="date"
                value={expiryDate}
                onChange={(e) =>
                  setExpiryDate(e.target.value)
                }
                className="w-full border rounded-lg p-3 mt-2"
              />
            </div>

            <button
              onClick={handleSubmit}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-xl"
            >
              Submit Bluebook
            </button>

          </div>

        )}

      </div>
    </div>
  );
}

export default Bluebook;