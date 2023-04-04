import stopsData from './stops.json' assert { type: "json" };

const RETURN_COUNT = 40; // Number of stops to return

// Generates a match score for a stop based on a search string
// name: name of the stop
// publicId: public-facing ID of the stop

function calculateMatchScore(searchString, name, publicId) {
    let matchScore = 0;

    let matchString = searchString.toLowerCase();
    let matchWords = matchString.split(" ")
        .filter(word => word.length > 0);

    // Do not compute match score if there are no words in the search string
    if (matchWords.length === 0) {
        return matchScore;
    }

    let stopName = name.toLowerCase();
    let stopWords = stopName.toLowerCase().split(" ")
        .filter(word => word.length > 0);
    stopWords.push(publicId); // Add public ID to stop words to allow for ID searches

    if (publicId === matchString) {
        matchScore += 50000; // Exact match (with priority for searches by stop ID)
    }

    if (stopName.startsWith(matchString)) {
        matchScore += 10000; // Exact match
    }

    for (let matchWord of matchWords) {
        for (let stopWord of stopWords) {
            if (stopWord.startsWith(matchWord)) {
                matchScore += 50 * matchWord.length; // Partial match, favour longer words
            } else if (stopWord.includes(matchWord)) {
                matchScore += 10; // Barely a match
            }
        }
    }

    if (stopName.includes(matchString)) {
        matchScore += 1; // Useful tiebreaker
        // i.e. Search for "Queens SB" matches both:
        // "Upper Queens North of Chiddington SB"
        // "Adelaide at Queens SB"
        // But clearly the second one is a better match
    }

    return matchScore;
}

function getMatchingStops(searchString, count) {
    const cleanSearchString = searchString.replace(/[^a-zA-Z0-9 ]/g, "");
    if (cleanSearchString.length === 0) {
        return [];
    }

    let stops = stopsData.slice(0);

    for (let stop of stops) {
        stop.matchScore = calculateMatchScore(searchString, stop.name, stop.stopPublicId);
    }

    stops.sort((a, b) => (b.matchScore - a.matchScore) * 1000 + a.name.localeCompare(b.name, "en"));
    stops = stops.slice(0, count);

    stops = stops.filter(stop => stop.matchScore > 0); // Remove stops that don't match the search query

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
    const searchString = body.searchString;

    if (typeof searchString !== "string") {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Invalid searchString" }),
        };
    }

    const output = getMatchingStops(searchString, RETURN_COUNT);

    return {
        statusCode: 200,
        body: JSON.stringify(output),
    }
}
