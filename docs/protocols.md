# GSS-OS Protocol Documentation

## 1. System Architecture

### Trust Boundaries
- **Technicians**: Write-only access to `compliance_logs`. Can upload evidence but cannot modify history.
- **Business Tenants**: Read-only access to `attendance_periods`. Can only view data linked to their `company_id`.
- **Admin**: Full access.

### Hardware Bridge
- **ESP32 (The Brain)**: Handles bridging between physical sensors and the GSS-OS API.
- **ZKTeco (The Eye)**: Biometric/Card reader input masked as Wiegand data.
- **Paradox IP150**: Alarm panel interface.

---

## 2. Communication Protocols

### Paradox Alarm Protocol (Simulated IP150)
JSON Payload sent to `/api/alarm-events`:
```json
{
  "event_group": 1,
  "zone_id": 5,
  "partition": 1,
  "status": "OPEN"
}
```
- `event_group`: `1` (Zone Open), `0` (Zone Close).
- `zone_id`: The specific sensor/zone number.

### ZKTeco/Wiegand Protocol (Simulated ESP32 Bridge)
JSON Payload sent to `/api/access-control`:
```json
{
  "device_id": "esp32_01",
  "credential_type": "wiegand_26",
  "hex_value": "3F2A1C"
}
```

### Bluetooth Low Energy (BLE) Logic (Staff Attendance)
JSON Payload sent to `/api/gatekeeper`:
```json
{
  "device_id": "esp32_01",
  "credential_type": "ble_uuid",
  "uuid": "123e4567-e89b-12d3-a456-426614174000"
}
```
**Logic**:
- Check if `uuid` exists in `credentials`.
- Check if `valid_until` is future.
- Check Schedule (08:00 - 17:00).
- If valid -> Log to `attendance_periods`.

---

## 3. Compliance Uploads
**Technician App Flow**:
1. Technician takes photo of energizer.
2. Inputs Voltage Reading.
3. Uploads to `/api/compliance`.

**Payload**:
```json
{
  "site_id": "site_123",
  "technician_id": "tech_456",
  "voltage": 7500,
  "photo_url": "https://storage.example.com/compliance-evidence/img_001.jpg",
  "gps": { "lat": -33.9249, "lng": 18.4241 }
}
```
**Validation**:
- If `voltage` > 6000V -> Status: `COMPLIANT` (Green).
- Else -> Status: `NON-COMPLIANT` (Red).
