// mock-ble.js
// Simulates an ESP32 sending Staff UUID at 08:00 (In) and 17:00 (Out)

const fetch = require('node-fetch'); // Needs 'node-fetch' installed or use Node 18+ native fetch

const API_URL = "http://localhost:3000/api/gatekeeper";
const STAFF_UUID = "123e4567-e89b-12d3-a456-426614174000";

async function simulateScan(action) {
    console.log(`[BLE SIM] Simulating scan for: ${action}`);

    const payload = {
        device_id: "esp32_01",
        credential_type: "ble_uuid", // Matches DB
        uuid: STAFF_UUID
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log(`[BLE SIM] Response:`, data);
    } catch (err) {
        console.error(`[BLE SIM] Error connecting to ${API_URL}:`, err.message);
    }
}

// Simulate IN at 08:00
setTimeout(() => simulateScan("CHECK IN 08:00"), 1000);

// Simulate OUT at 17:00 (Simulated delay)
setTimeout(() => simulateScan("CHECK OUT 17:00"), 3000);
