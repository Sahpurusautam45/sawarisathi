import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { auth, db } from "../firebase/firebase";

import { doc, getDoc } from "firebase/firestore";

import {
  uploadVehicleDocument,
  getVehicleDocuments,
} from "../services/documentsService";

import LoadingSpinner from "../components/LoadingSpinner";


function Documents() {
  const { vehicleId } = useParams();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState(null);
  const [documents, setDocuments] = useState([]);

  const [selectedFile, setSelectedFile] = useState(null);
  const [documentType, setDocumentType] = useState("");

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);


  // ==========================================
  // LOAD VEHICLE + DOCUMENTS
  // ==========================================

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = auth.currentUser;

        if (!user) {
          navigate("/login");
          return;
        }

        // Get vehicle
        const vehicleRef = doc(
          db,
          "vehicles",
          vehicleId
        );

        const vehicleSnap = await getDoc(vehicleRef);

        if (vehicleSnap.exists()) {
          setVehicle(vehicleSnap.data());
        }

        // Get documents
        const documentList =
          await getVehicleDocuments(vehicleId);

        setDocuments(documentList);

      } catch (error) {
        console.error(
          "Documents loading error:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [vehicleId, navigate]);


  // ==========================================
  // FILE SELECT
  // ==========================================

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    // 10 MB limit for now
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10 MB.");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
  };


  // ==========================================
  // UPLOAD
  // ==========================================

  const handleUpload = async () => {
    if (!documentType) {
      alert("Please select a document type.");
      return;
    }

    if (!selectedFile) {
      alert("Please select a file.");
      return;
    }

    try {
      setUploading(true);

      const uploadedDocument =
        await uploadVehicleDocument(
          vehicleId,
          selectedFile,
          documentType
        );

      setDocuments((previous) => [
        uploadedDocument,
        ...previous,
      ]);

      setSelectedFile(null);
      setDocumentType("");

      alert(
        "Document uploaded successfully!"
      );

    } catch (error) {
      console.error(
        "Document upload error:",
        error
      );

      alert(
        error.message ||
        "Failed to upload document."
      );

    } finally {
      setUploading(false);
    }
  };


  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return <LoadingSpinner />;
  }


  // ==========================================
  // VEHICLE NOT FOUND
  // ==========================================

  if (!vehicle) {
    return (
      <div className="min-h-screen flex items-center justify-center">

        <div className="text-center">

          <div className="text-6xl">
            🚗
          </div>

          <h2 className="text-2xl font-bold mt-4">
            Vehicle not found
          </h2>

          <button
            onClick={() =>
              navigate("/dashboard")
            }
            className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-xl"
          >
            Back to Dashboard
          </button>

        </div>

      </div>
    );
  }


  return (
    <div className="min-h-screen bg-slate-100 p-8">

      <div className="max-w-5xl mx-auto">

        {/* BACK BUTTON */}

        <button
          onClick={() =>
            navigate(`/vehicle/${vehicleId}`)
          }
          className="mb-6 bg-white border px-4 py-2 rounded-xl hover:bg-slate-100"
        >
          ← Back to Vehicle Details
        </button>


        {/* MAIN CARD */}

        <div className="bg-white rounded-2xl shadow-lg p-8">

          <h1 className="text-3xl font-bold">
            📄 Vehicle Documents
          </h1>

          <p className="text-gray-500 mt-2">
            {vehicle.brand} {vehicle.model} ·{" "}
            {vehicle.vehicleNumber}
          </p>


          {/* =====================================
              UPLOAD SECTION
          ===================================== */}

          <div className="mt-8 border rounded-2xl p-6">

            <h2 className="text-xl font-bold">
              Upload Document
            </h2>

            <p className="text-gray-500 mt-1">
              Upload Bluebook, insurance,
              government ID or other supporting
              documents.
            </p>


            {/* DOCUMENT TYPE */}

            <div className="mt-5">

              <label className="font-semibold">
                Document Type
              </label>

              <select
                value={documentType}
                onChange={(e) =>
                  setDocumentType(e.target.value)
                }
                className="w-full border rounded-lg p-3 mt-2"
              >

                <option value="">
                  Select Document Type
                </option>

                <option value="Bluebook">
                  Bluebook
                </option>

                <option value="Insurance">
                  Insurance Document
                </option>

                <option value="Government ID">
                  Government ID
                </option>

                <option value="Citizenship">
                  Citizenship
                </option>

                <option value="Driving License">
                  Driving License
                </option>

                <option value="Other">
                  Other
                </option>

              </select>

            </div>


            {/* FILE */}

            <div className="mt-5">

              <label className="font-semibold">
                Select File
              </label>

              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="w-full border rounded-lg p-3 mt-2"
              />

              <p className="text-sm text-gray-500 mt-2">
                PDF, JPG, JPEG or PNG · Maximum 10 MB
              </p>

            </div>


            {/* SELECTED FILE */}

            {selectedFile && (
              <div className="mt-4 bg-blue-50 rounded-lg p-4">

                <p className="font-semibold">
                  Selected file
                </p>

                <p className="text-gray-600 mt-1">
                  {selectedFile.name}
                </p>

              </div>
            )}


            {/* UPLOAD BUTTON */}

            <button
              onClick={handleUpload}
              disabled={uploading}
              className="mt-6 w-full bg-blue-700 hover:bg-blue-800 disabled:bg-gray-400 text-white py-3 rounded-xl"
            >

              {uploading
                ? "Uploading..."
                : "Upload Document"}

            </button>

          </div>


          {/* =====================================
              DOCUMENT LIST
          ===================================== */}

          <div className="mt-10">

            <h2 className="text-2xl font-bold">
              Uploaded Documents
            </h2>


            {documents.length === 0 ? (

              <div className="mt-5 border rounded-xl p-8 text-center">

                <div className="text-5xl">
                  📄
                </div>

                <p className="text-gray-500 mt-3">
                  No documents uploaded yet.
                </p>

              </div>

            ) : (

              <div className="mt-5 space-y-4">

                {documents.map((document) => (

                  <div
                    key={document.id}
                    className="border rounded-xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                  >

                    <div>

                      <h3 className="font-bold text-lg">
                        📄 {document.documentType}
                      </h3>

                      <p className="text-gray-500 mt-1">
                        {document.fileName}
                      </p>

                      <span className="inline-block mt-2 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm">
                        {document.status || "Pending Verification"}
                      </span>

                    </div>


                    <a
                      href={document.downloadURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-center"
                    >
                      View Document
                    </a>

                  </div>

                ))}

              </div>

            )}

          </div>

        </div>

      </div>

    </div>
  );
}

export default Documents;
