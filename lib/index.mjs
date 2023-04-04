import { handler as nearbyStops } from "./nearby_stops.mjs";
import { handler as stopsSearch } from "./stops_search.mjs";

function getRawResponse(event) {
    switch (event.routeKey) {
        case "POST /nearby-stops":
            return nearbyStops(event);
        case "POST /stops-search":
            return stopsSearch(event);
        default:
            return {
                statusCode: 404,
                body: JSON.stringify({ error: "Not found"}),
            }
    }
}

export const handler = async (event) => {
    const response = getRawResponse(event);
    response.headers = {
        "content-type": "application/json",
    }

    return response;
};
