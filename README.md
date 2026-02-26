# GSS-OS Prototype

Functional prototype of the GSS-OS Ecosystem.

## Installation
```bash
npm install
```

## Running the System
### 1. Start Dashboard
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

### 2. Run Simulations via Terminal
Open separate terminals for each:

**Attendance (BLE)**
```bash
node scripts/mock-ble.js
```
*Check "Business Portal" for logs.*

**Alarm Event**
```bash
node scripts/mock-alarm.js
```
*Check "Super Admin" for alerts.*

**Compliance Upload**
```bash
node scripts/mock-upload.js
```
*Check console or Technician App state.*
