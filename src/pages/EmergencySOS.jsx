import React from "react";

function EmergencySOS() {

    // ==========================================
    // LOCATION STATE
    // ==========================================

    const [location, setLocation] =
        React.useState(null);

    const [locationLoading, setLocationLoading] =
        React.useState(false);

    const [locationError, setLocationError] =
        React.useState("");

    const [hospitals, setHospitals] =
        React.useState([]);

    const [hospitalLoading, setHospitalLoading] =
        React.useState(false);

    const [hospitalError, setHospitalError] =
        React.useState("");



    const [garages, setGarages] =
        React.useState([]);

    const [garageLoading, setGarageLoading] =
        React.useState(false);

    const [garageError, setGarageError] =
        React.useState("");




    // ==========================================
    // CALL EMERGENCY SERVICE
    // ==========================================

    const handleCall = (number) => {

        window.location.href =
            `tel:${number}`;

    };


    // ==========================================
    // DETECT USER LOCATION
    // ==========================================

    const detectLocation = () => {

        if (!navigator.geolocation) {

            setLocationError(
                "Location services are not supported by this browser."
            );

            return;
        }


        setLocationLoading(true);
        setLocationError("");


        navigator.geolocation.getCurrentPosition(

            (position) => {

                const {
                    latitude,
                    longitude
                } = position.coords;


                setLocation({
                    latitude,
                    longitude
                });


                setLocationLoading(false);

            },


            (error) => {

                console.error(
                    "Location error:",
                    error
                );


                setLocationLoading(false);


                if (error.code === 1) {

                    setLocationError(
                        "Location permission was denied. Please allow location access."
                    );

                } else if (error.code === 2) {

                    setLocationError(
                        "Your location could not be detected."
                    );

                } else if (error.code === 3) {

                    setLocationError(
                        "Location request timed out. Please try again."
                    );

                } else {

                    setLocationError(
                        "Unable to detect your location."
                    );

                }

            },


            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }

        );

    };

    // ==========================================
    // FIND NEARBY HOSPITALS
    // ==========================================

    // ==========================================
    // FIND NEARBY HOSPITALS - GOOGLE PLACES
    // ==========================================

    const findNearbyHospitals = async () => {
        if (!location) {
            setHospitalError("Please detect your location first.");
            return;
        }

        setHospitalLoading(true);
        setHospitalError("");
        setHospitals([]);

        try {
            const apiKey =
                import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

            const response = await fetch(
                "https://places.googleapis.com/v1/places:searchNearby",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        "X-Goog-Api-Key": apiKey,
                        "X-Goog-FieldMask":
                            "places.id,places.displayName,places.location,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber"
                    },

                    body: JSON.stringify({
                        includedTypes: ["hospital"],

                        maxResultCount: 10,

                        locationRestriction: {
                            circle: {
                                center: {
                                    latitude: location.latitude,
                                    longitude: location.longitude
                                },
                                radius: 20000
                            }
                        }
                    })
                }
            );

            if (!response.ok) {
                const errorText = await response.text();

                console.error(
                    "Google Places error:",
                    errorText
                );

                throw new Error(
                    "Google Places request failed"
                );
            }

            const data = await response.json();

            console.log(
                "Google Hospitals:",
                data
            );

            const results =
                (data.places || []).map((place) => ({
                    id: place.id,

                    name:
                        place.displayName?.text ||
                        "Unnamed Hospital",

                    phone:
                        place.internationalPhoneNumber ||
                        place.nationalPhoneNumber ||
                        "",

                    address:
                        place.formattedAddress ||
                        "Address unavailable",

                    latitude:
                        place.location?.latitude,

                    longitude:
                        place.location?.longitude
                }));

            if (results.length === 0) {

                setHospitalError(
                    "No hospitals found within 20 km of your location."
                );

            } else {

                setHospitals(results);

            }

        } catch (error) {

            console.error(
                "Nearby hospital error:",
                error
            );

            setHospitalError(
                "Unable to find nearby hospitals. Please try again."
            );

        } finally {

            setHospitalLoading(false);

        }
    };

    // ==========================================
    // FIND NEARBY GARAGES - GOOGLE PLACES
    // ==========================================

    const findNearbyGarages = async () => {
        if (!location) {
            setGarageError("Please detect your location first.");
            return;
        }

        setGarageLoading(true);
        setGarageError("");
        setGarages([]);

        try {
            const apiKey =
                import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

            const response = await fetch(
                "https://places.googleapis.com/v1/places:searchNearby",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        "X-Goog-Api-Key": apiKey,
                        "X-Goog-FieldMask":
                            "places.id,places.displayName,places.location,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber"
                    },

                    body: JSON.stringify({
                        includedTypes: ["car_repair"],

                        maxResultCount: 10,

                        locationRestriction: {
                            circle: {
                                center: {
                                    latitude: location.latitude,
                                    longitude: location.longitude
                                },
                                radius: 20000
                            }
                        }
                    })
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                console.error(
                    "Google Garage error:",
                    errorText
                );
                throw new Error("Google Garage request failed");
            }

            const data = await response.json();

            console.log(
                "Google Garages:",
                data
            );

            const results =
                (data.places || []).map((place) => ({
                    id: place.id,

                    name:
                        place.displayName?.text ||
                        "Unnamed Garage",

                    phone:
                        place.internationalPhoneNumber ||
                        place.nationalPhoneNumber ||
                        "",

                    address:
                        place.formattedAddress ||
                        "Address unavailable",

                    latitude:
                        place.location?.latitude,

                    longitude:
                        place.location?.longitude
                }));

            if (results.length === 0) {

                setGarageError(
                    "No garages found within 20 km of your location."
                );

            } else {

                setGarages(results);

            }

        } catch (error) {

            console.error(
                "Nearby garage error:",
                error
            );

            setGarageError(
                "Unable to find nearby garages. Please try again."
            );

        } finally {

            setGarageLoading(false);

        }
    };


    // ==========================================
    // PAGE
    // ==========================================

    return (

        <div className="min-h-screen bg-gray-100 py-10 px-4">

            <div className="max-w-5xl mx-auto">


                {/* ==========================================
                    HEADER
                ========================================== */}

                <div className="text-center mb-10">

                    <div className="text-6xl mb-4">
                        🚨
                    </div>

                    <h1 className="text-4xl font-bold text-gray-900">
                        Emergency SOS
                    </h1>

                    <p className="text-gray-600 mt-3">
                        Get quick access to emergency services
                        and nearby assistance.
                    </p>

                </div>


                {/* ==========================================
                    LOCATION
                ========================================== */}

                <div className="bg-white rounded-2xl shadow-md p-6 mb-8 text-center">

                    <div className="text-4xl mb-3">
                        📍
                    </div>

                    <h2 className="text-xl font-bold">
                        Your Location
                    </h2>

                    <p className="text-gray-500 mt-2">
                        Location will be used to find nearby
                        emergency services.
                    </p>


                    <button
                        type="button"
                        onClick={detectLocation}
                        disabled={locationLoading}
                        className="mt-5 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-60"
                    >

                        {locationLoading
                            ? "📍 Detecting..."
                            : "📍 Detect My Location"}

                    </button>


                    {/* LOCATION SUCCESS */}

                    {location && (

                        <div className="mt-5 bg-green-50 border border-green-200 rounded-xl p-4">

                            <p className="font-semibold text-green-800">
                                ✅ Location detected
                            </p>

                            <p className="text-sm text-green-700 mt-2">
                                Latitude: {location.latitude}
                            </p>

                            <p className="text-sm text-green-700">
                                Longitude: {location.longitude}
                            </p>

                        </div>

                    )}


                    {/* LOCATION ERROR */}

                    {locationError && (

                        <div className="mt-5 bg-red-50 border border-red-200 rounded-xl p-4">

                            <p className="text-sm font-semibold text-red-800">
                                ⚠️ {locationError}
                            </p>

                        </div>

                    )}

                </div>


                {/* ==========================================
                    EMERGENCY SERVICES
                ========================================== */}

                <div>

                    <h2 className="text-2xl font-bold mb-5">
                        Emergency Services
                    </h2>


                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">


                        {/* ======================================
                            POLICE
                        ====================================== */}

                        <div className="bg-white rounded-2xl shadow-md p-6">

                            <div className="flex items-center gap-4">

                                <div className="text-5xl">
                                    👮
                                </div>

                                <div className="flex-1">

                                    <h3 className="text-xl font-bold">
                                        Police
                                    </h3>

                                    <p className="text-gray-500">
                                        Emergency police assistance
                                    </p>

                                </div>

                            </div>


                            <button
                                type="button"
                                onClick={() =>
                                    handleCall("100")
                                }
                                className="w-full mt-5 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition"
                            >
                                📞 Call Police — 100
                            </button>

                        </div>


                        {/* ======================================
                            AMBULANCE
                        ====================================== */}

                        <div className="bg-white rounded-2xl shadow-md p-6">

                            <div className="flex items-center gap-4">

                                <div className="text-5xl">
                                    🚑
                                </div>

                                <div className="flex-1">

                                    <h3 className="text-xl font-bold">
                                        Ambulance
                                    </h3>

                                    <p className="text-gray-500">
                                        Emergency medical assistance
                                    </p>

                                </div>

                            </div>


                            <button
                                type="button"
                                onClick={() =>
                                    handleCall("102")
                                }
                                className="w-full mt-5 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition"
                            >
                                📞 Call Ambulance — 102
                            </button>

                        </div>


                        {/* ======================================
                            FIRE SERVICE
                        ====================================== */}

                        <div className="bg-white rounded-2xl shadow-md p-6">

                            <div className="flex items-center gap-4">

                                <div className="text-5xl">
                                    🔥
                                </div>

                                <div className="flex-1">

                                    <h3 className="text-xl font-bold">
                                        Fire Service
                                    </h3>

                                    <p className="text-gray-500">
                                        Emergency fire assistance
                                    </p>

                                </div>

                            </div>


                            <button
                                type="button"
                                onClick={() =>
                                    handleCall("101")
                                }
                                className="w-full mt-5 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition"
                            >
                                📞 Call Fire Service — 101
                            </button>

                        </div>


                        {/* ======================================
                            TRAFFIC POLICE
                        ====================================== */}

                        <div className="bg-white rounded-2xl shadow-md p-6">

                            <div className="flex items-center gap-4">

                                <div className="text-5xl">
                                    🚦
                                </div>

                                <div className="flex-1">

                                    <h3 className="text-xl font-bold">
                                        Traffic Police
                                    </h3>

                                    <p className="text-gray-500">
                                        Traffic emergency assistance
                                    </p>

                                </div>

                            </div>


                            <button
                                type="button"
                                onClick={() =>
                                    handleCall("103")
                                }
                                className="w-full mt-5 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition"
                            >
                                📞 Call Traffic Police — 103
                            </button>

                        </div>

                    </div>

                </div>


                {/* ==========================================
                    NEARBY SERVICES
                ========================================== */}

                <div className="mt-10">

                    <h2 className="text-2xl font-bold mb-5">
                        Nearby Assistance
                    </h2>


                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">


                        {/* ======================================
                            HOSPITALS
                        ====================================== */}

                        <div className="bg-white rounded-2xl shadow-md p-6">

                            <div className="text-4xl mb-3">
                                🏥
                            </div>

                            <h3 className="text-xl font-bold">
                                Nearby Hospitals
                            </h3>

                            <p className="text-gray-500 mt-2">
                                Find hospitals near your current
                                location.
                            </p>



                            <button
                                type="button"
                                onClick={findNearbyHospitals}
                                disabled={!location || hospitalLoading}
                                className="mt-5 w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50"
                            >
                                {hospitalLoading
                                    ? "🏥 Searching..."
                                    : "🏥 Find Nearby Hospitals"}
                            </button>

                            {hospitalError && (
                                <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
                                    <p className="text-sm font-semibold text-red-800">
                                        ⚠️ {hospitalError}
                                    </p>
                                </div>
                            )}


                            {hospitals.length > 0 && (
                                <div className="mt-5 space-y-3">

                                    <h4 className="font-bold text-gray-800">
                                        Nearby Hospitals
                                    </h4>
                                    {hospitals.slice(0, 10).map((hospital) => (

                                        <div
                                            key={hospital.id}
                                            className="border rounded-xl p-4 bg-gray-50"
                                        >

                                            <p className="font-semibold text-gray-900">
                                                🏥 {hospital.name}
                                            </p>

                                            <p className="text-sm text-gray-500 mt-2">
                                                📍 {hospital.address}
                                            </p>

                                            {hospital.phone ? (

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(hospital.phone);
                                                        alert(`Hospital number copied: ${hospital.phone}`);
                                                    }}
                                                    className="mt-3 w-full py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                                                >
                                                    📞 {hospital.phone}
                                                </button>

                                            ) : (

                                                <p className="text-sm text-gray-400 mt-3">
                                                    📞 Phone number not available
                                                </p>

                                            )}

                                            <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${hospital.latitude},${hospital.longitude}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-2 block w-full py-2 bg-blue-600 text-white rounded-lg font-semibold text-center hover:bg-blue-700 transition"
                                            >
                                                🗺️ Open in Google Maps
                                            </a>

                                        </div>

                                    ))}

                                </div>
                            )}

                        </div>


                        {/* ======================================
                            GARAGES
                        ====================================== */}

                        <div className="bg-white rounded-2xl shadow-md p-6">

                            <div className="text-4xl mb-3">
                                🔧
                            </div>

                            <h3 className="text-xl font-bold">
                                Nearby Garages
                            </h3>

                            <p className="text-gray-500 mt-2">
                                Find vehicle repair services near
                                you.
                            </p>


                            <button
                                type="button"
                                onClick={findNearbyGarages}
                                disabled={!location || garageLoading}
                                className="mt-5 w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50"
                            >
                                {garageLoading
                                    ? "🔧 Searching..."
                                    : "🔧 Find Nearby Garages"}
                            </button>

                            {garageError && (
                                <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
                                    <p className="text-sm font-semibold text-red-800">
                                        ⚠️ {garageError}
                                    </p>
                                </div>
                            )}

                            {garageError && (
                                <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
                                    <p className="text-sm font-semibold text-red-800">
                                        ⚠️ {garageError}
                                    </p>
                                </div>
                            )}

                            {garages.length > 0 && (
                                <div className="mt-5 space-y-3">

                                    <h4 className="font-bold text-gray-800">
                                        Nearby Garages
                                    </h4>

                                    {garages.slice(0, 10).map((garage) => (

                                        <div
                                            key={garage.id}
                                            className="border rounded-xl p-4 bg-gray-50"
                                        >

                                            <p className="font-semibold text-gray-900">
                                                🔧 {garage.name}
                                            </p>

                                            <p className="text-sm text-gray-500 mt-2">
                                                📍 {garage.address}
                                            </p>

                                            {garage.phone ? (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(
                                                            garage.phone
                                                        );

                                                        alert(
                                                            `Garage number copied: ${garage.phone}`
                                                        );
                                                    }}
                                                    className="mt-3 w-full py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                                                >
                                                    📞 {garage.phone}
                                                </button>
                                            ) : (
                                                <p className="text-sm text-gray-400 mt-3">
                                                    📞 Phone number not available
                                                </p>
                                            )}

                                            <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${garage.latitude},${garage.longitude}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-2 block w-full py-2 bg-blue-600 text-white rounded-lg font-semibold text-center hover:bg-blue-700 transition"
                                            >
                                                🗺️ Open in Google Maps
                                            </a>

                                        </div>

                                    ))}

                                </div>
                            )}

                        </div>

                    </div>

                </div>


                {/* ==========================================
                    SAFETY NOTE
                ========================================== */}

                <div className="mt-10 bg-yellow-50 border border-yellow-200 rounded-2xl p-5">

                    <p className="text-sm text-yellow-800">
                        ⚠️ In a serious emergency, contact the
                        appropriate emergency service directly.
                    </p>

                </div>

            </div>

        </div>

    );

}

export default EmergencySOS;