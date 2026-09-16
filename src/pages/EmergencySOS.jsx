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

    const findNearbyHospitals = async () => {
        if (!location) {
            setHospitalError("Please detect your location first.");
            return;
        }

        setHospitalLoading(true);
        setHospitalError("");
        setHospitals([]);

        try {
            const { latitude, longitude } = location;

            const query = `
    [out:json][timeout:25];
    (
      nwr["amenity"="hospital"](around:20000,${latitude},${longitude});
      nwr["healthcare"="hospital"](around:20000,${latitude},${longitude});
    );
    out center tags;
`;

            const response = await fetch(
                "https://overpass-api.de/api/interpreter",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    body: new URLSearchParams({
                        data: query
                    })
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Overpass error:", errorText);
                throw new Error("Hospital API request failed");
            }

            const data = await response.json();

            const results = data.elements
                .map((place) => {
                    const lat = place.lat ?? place.center?.lat;
                    const lon = place.lon ?? place.center?.lon;

                    if (lat === undefined || lon === undefined) {
                        return null;
                    }

                    return {
                        id: `${place.type}-${place.id}`,
                        name: place.tags?.name || "Unnamed Hospital",
                        latitude: lat,
                        longitude: lon
                    };
                })
                .filter(Boolean);

            if (results.length === 0) {
                setHospitalError(
                    "No hospitals found within 20 km of your location."
                );
            } else {
                setHospitals(results);
            }

        } catch (error) {
            console.error("Nearby hospital error:", error);

            setHospitalError(
                "Unable to find nearby hospitals. Please try again."
            );
        } finally {
            setHospitalLoading(false);
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

                                            <p className="font-semibold">
                                                🏥 {hospital.name}
                                            </p>

                                            <p className="text-sm text-gray-500 mt-1">
                                                📍 {hospital.latitude.toFixed(5)},
                                                {" "}
                                                {hospital.longitude.toFixed(5)}
                                            </p>

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
                                className="mt-5 w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition"
                            >
                                Find Nearby Garages
                            </button>

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