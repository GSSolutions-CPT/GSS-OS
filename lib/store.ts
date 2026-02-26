// lib/store.ts
// Simple in-memory store for the demo to work without a running DB if needed.

declare global {
    var _mockStore: any;
}

if (!global._mockStore) {
    global._mockStore = {
        attendance: [],
        compliance: [],
        alarms: [],
        visitors: []
    };
}

export const mockStore = global._mockStore;
