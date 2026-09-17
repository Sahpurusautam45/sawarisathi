const testGooglePlaces = async (latitude, longitude) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    console.log("Google API key loaded:", !!apiKey);

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
                maxResultCount: 5,
                locationRestriction: {
                    circle: {
                        center: {
                            latitude,
                            longitude
                        },
                        radius: 20000
                    }
                }
            })
        }
    );

    const data = await response.json();

    console.log(
        "Google Places response:",
        JSON.stringify(data, null, 2)
    );

    return data;
};

export default testGooglePlaces;