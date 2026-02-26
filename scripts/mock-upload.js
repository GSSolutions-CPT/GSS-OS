// mock-upload.js
// Simulates Technician posting voltage + dummy image file

const fetch = require('node-fetch');

const API_URL = "http://localhost:3000/api/compliance";

const MOCK_PAYLOAD = {
    site_id: "site_123_mock", // In real flow, this UUID must match DB. We might need to fetch it first or rely on loose coupling.
    technician_id: "tech_456_mock",
    voltage: 7500, // > 6000 is Green
    photo_url: "https://via.placeholder.com/150", // Dummy URL
    gps: { lat: -33.9249, lng: 18.4241 }
};

async function uploadCompliance() {
    console.log(`[COMPLIANCE SIM] Uploading Evidence...`);
    console.log(`Data: Voltage=${MOCK_PAYLOAD.voltage}, URL=${MOCK_PAYLOAD.photo_url}`);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(MOCK_PAYLOAD)
        });

        const data = await response.json();
        console.log(`[COMPLIANCE SIM] Response:`, data);
    } catch (err) {
        console.error(`[COMPLIANCE SIM] Error connecting to ${API_URL}:`, err.message);
    }
}

uploadCompliance();
