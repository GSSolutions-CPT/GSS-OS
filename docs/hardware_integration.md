# GSS-OS Hardware Integration Guide

This guide explains how to connect physical devices (ESP32, ZKTeco, Paradox) to your deployed GSS-OS Software.

## 1. The Architecture
Your Software (`https://gss-7exg4thcw-gss-os.vercel.app`) expects **HTTP POST** requests with JSON data.
Since devices like specific Alarm Panels or old Wiegand Readers cannot send JSON natively, we use an **ESP32** as a "Bridge" (The Brain).

**Flow:**
`[Sensor/Reader] --(Wires/Serial)--> [ESP32] --(WiFi/HTTPS)--> [GSS-OS API]`

---

## 2. ESP32 Firmware Example (Arduino C++)
Flash this logic onto your ESP32 to act as a Gatekeeper (Attendance).

### Required Libraries
- `WiFi.h`
- `HTTPClient.h`

### Code Snippet
```cpp
#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Your Live Vercel URL
const char* serverUrl = "https://gss-7exg4thcw-gss-os.vercel.app/api/gatekeeper";

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
}

// Call this function when a Card is Scanned or BLE UUID found
void sendAttendanceLog(String uuid) {
  if(WiFi.status() == WL_CONNECTED){
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    // Construct JSON Payload
    // Matches the format in scripts/mock-ble.js
    String jsonPayload = "{\"device_id\": \"esp32_real_01\", \"credential_type\": \"ble_uuid\", \"uuid\": \"" + uuid + "\"}";
    
    int httpResponseCode = http.POST(jsonPayload);
    
    if(httpResponseCode > 0){
      String response = http.getString();
      Serial.println(httpResponseCode);
      Serial.println(response); // "Checked In" or "Checked Out"
    } else {
      Serial.print("Error on sending POST: ");
      Serial.println(httpResponseCode);
    }
    http.end();
  }
}

void loop() {
  // Example: Simulate a scan everyone 10 seconds
  // In real life, replace this with your Wiegand/BLE Reader Logic
  sendAttendanceLog("123e4567-e89b-12d3-a456-426614174000");
  delay(10000); 
}
```

---

## 3. Wiring Guide

### A. ZKTeco / Card Readers (The Eye)
Most biometric readers utilize the **Wiegand Protocol** (Green/White wires).
1.  Connect **D0 (Green)** to ESP32 **GPIO 18**.
2.  Connect **D1 (White)** to ESP32 **GPIO 19**.
3.  Connect **GND** to **GND** (Common Ground is critical).
4.  Use the standard `Wiegand` library for Arduino to read the Hex Code.
5.  Send the Hex Code to `/api/gatekeeper` as `credential_type: "wiegand_26"`.

### B. Paradox Alarm Panel
For the Paradox IP150, you have two options:
1.  **Direct Serial**: Connect ESP32 RX/TX to the Panel's Serial Port (Requires protocol reverse engineering or the `ParadoxSerial` library).
2.  **Output PGM**: Program the Panel to trigger a PGM (Output) when an Alarm occurs.
    *   Connect Panel **PGM** pin to ESP32 **GPIO 34** (Input).
    *   When GPIO 34 goes HIGH, ESP32 sends `POST /api/alarm-events` with `{"status": "OPEN"}`.

---

## 4. Testing
1.  Open the **Super Admin** Dashboard on your computer.
2.  Power up the ESP32.
3.  Trigger the input (or let the loop run).
4.  Watch the Realtime Feed update instantly.
