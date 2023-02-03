const axios = require('axios');
const fs = require('fs');

const BASE_URI = "https://realtime.londontransit.ca";

async function fetchBusRouteIds() {
    let routeIds = [];

    let requestBody = {
        version: "1.1",
        method: "GetAddressMatcherResults",
        params: {
            addrString: "route",
            flags: "",
        },
    };

    let response = await axios.post(BASE_URI + "/MapAddress", requestBody);
    let responseBody = response.data;

    let results = responseBody.result.results;

    for (let result of results) {
        if (result.objectType === "t4Line" && result.objectIdStr.length > 0) {
            let newRouteId = Math.floor(result.objectId / 10); // The last digit of a route stores its direction

            if (!routeIds.includes(newRouteId)) {
                routeIds.push(newRouteId);
            }
        }
    }

    return routeIds;
}

async function fetchBusStops() {
    let stops = [];
    let busRouteIds = await fetchBusRouteIds();

    for (let busRouteId of busRouteIds) {
        await new Promise((resolve) => setTimeout(resolve, 2000));

        let requestBody = {
            version: "1.1",
            method: "GetLineDetails",
            params: {
                lineId: busRouteId,
                requestedDate: "",
            }
        }

        console.log("Bus route id: " + busRouteId);
        
        let response = await axios.post(BASE_URI + "/TI_FixedRoute_Line", requestBody);
        let responseBody = response.data;

        let directions = responseBody.result.directions;
        directions.forEach((direction) => {
            let stopsAlongRoute = direction.stops;
            stopsAlongRoute.forEach((stop) => {
                let stopObject = {
                    stopId: stop.stopId,
                    stopPublicId: stop.stopPublicId,
                    name: stop.name.trim(),
                    lat: stop.coordinate.lat,
                    lon: stop.coordinate.lon,
                }

                if (!stops.some((s) => s.stopId === stopObject.stopId)) {
                    stops.push(stopObject);
                }
            })
        });
    }

    return stops;
}

async function writeToFile(fileName) {
    let stops = await fetchBusStops();
    let json = JSON.stringify(stops);

    console.log("Total Stops: " + stops.length);

    await fs.promises.mkdir(fileName.match(/.*\//)[0], { recursive: true });

    fs.writeFile(fileName, json, 'utf8', (err) => {
        if (err) throw err;
    });

    console.log("Stops written to: " + fileName);
}

writeToFile("output/stops.json");
