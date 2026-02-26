// mock-alarm.js
// Simulates Paradox Panel sending Zone Open/Close

const fetch = require('node-fetch');

const API_URL = "http://localhost:3000/api/alarm-events";

async function triggerAlarm(status) {
    console.log(`[ALARM SIM] Triggering Zone 5: ${status}`);

    const payload = {
        event_group: status === "OPEN" ? 1 : 0,
        zone_id: 5,
        partition: 1,
        status: status
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log(`[ALARM SIM] Response:`, data);
    } catch (err) {
        console.error(`[ALARM SIM] Error connecting to ${API_URL}:`, err.message);
    }
}

// Trigger OPEN (Alarm)
setTimeout(() => triggerAlarm("OPEN"), 1000);

// Restore CLOSE (Safe)
setTimeout(() => triggerAlarm("CLOSE"), 5000);
