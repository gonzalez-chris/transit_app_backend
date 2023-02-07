import stopsData from './stops.json' assert { type: "json" };

const RETURN_COUNT = 40;  // Number of stops to return

// Coordinates of city centre London, ON (lat, lon)
// 42.98795694912048, -81.24602618871883

const LAT = 42.98795694912048;
const LAT_FACTOR = Math.cos(LAT);

// This function uses the equirectangular approximation of distance
// which is faster to compute than Haversine distance and is sufficiently accurate over small distances
function calculateDistanceScore(lat1, lon1, lat2, lon2) {
    const x = (lat2 - lat1);
    // Should be (lon2 - lon1) * Math.cos(lat1) but we precompute the cosine
    const y = (lon2 - lon1) * LAT_FACTOR;

    // Actual distance is (in km) is roughly 110.25 * sqrt(x * x + y * y)
    // Constants & sqrt are omitted to save computation time since we don't need the actual distance
    return (x * x) + (y * y)
}
function getClosestStops(lat, lon, count) {
    let stops = stopsData.slice(0);

    for (let stop of stops) {
        stop.distanceScore = calculateDistanceScore(lat, lon, stop.lat, stop.lon);
    }

    stops.sort((a, b) => a.distanceScore - b.distanceScore);
    stops = stops.slice(0, count);

    // Remove distanceScore from output
    for (let stop of stops) {
        delete stop.distanceScore;
    }

    return stops;
}

export const handler = (event) => {
    if (!event.body) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Missing body" }),
        };
    }

    const body = JSON.parse(event.body);

    const lat = parseFloat(body.lat);
    const lon = parseFloat(body.lon);

    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Invalid lat/lon" }),
        };
    }

    const output = getClosestStops(lat, lon, RETURN_COUNT);

    return {
        statusCode: 200,
        body: JSON.stringify(output),
    };
}
