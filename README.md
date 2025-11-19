# Ping & Modbus TCP Monitor

A desktop application built with Electron, React, and TypeScript for monitoring ping responses and Modbus TCP register values in real-time.

## Features

- **Ping Monitoring**
  - Monitor multiple IP addresses simultaneously
  - Real-time response time tracking
  - Packet loss statistics
  - Live charts showing response time over time
  - CSV data logging for historical analysis

- **Modbus TCP Polling**
  - Connect to Modbus TCP devices
  - Configurable device ID, register address, and register type
  - Real-time register value monitoring
  - Automatic disconnect detection and reconnection
  - Connection status indicators (Connected/Reconnecting)
  - Live charts showing register values over time
  - CSV data logging for historical analysis

- **Session Management**
  - Support for multiple simultaneous monitoring sessions
  - Historical session recall and visualization
  - Automatic CSV file storage
  - Session browser with active/historical indicators

## Installation

1. Install dependencies:
```bash
npm install
```

## Usage

### Development Mode

Build and run the application:
```bash
npm start
```

For development with auto-rebuild:
```bash
npm run dev
```
Then in another terminal:
```bash
electron .
```

### Building for Production

```bash
npm run build
```

## Application Structure

- `src/main/` - Electron main process
  - `main.ts` - Application entry point and IPC handlers
  - `ping-service.ts` - Ping monitoring service
  - `modbus-service.ts` - Modbus TCP polling service
  - `storage-service.ts` - CSV file management

- `src/renderer/` - React UI components
  - `App.tsx` - Main application component
  - `components/PingMonitor.tsx` - Ping monitoring interface
  - `components/ModbusMonitor.tsx` - Modbus monitoring interface
  - `components/LiveChart.tsx` - Real-time chart component
  - `components/SessionHistory.tsx` - Historical data viewer
  - `components/SessionCard.tsx` - Session list item

## Data Storage

All session data is stored as CSV files in the user data directory:
- macOS: `~/Library/Application Support/ping-modbus-monitor/sessions/`
- Windows: `%APPDATA%/ping-modbus-monitor/sessions/`
- Linux: `~/.config/ping-modbus-monitor/sessions/`

### CSV Formats

**Ping CSV:**
```
timestamp,ip,response_time_ms,status
2025-11-19T10:30:01.000Z,192.168.1.1,15.2,success
```

**Modbus CSV:**
```
timestamp,ip,device_id,register_address,value,status
2025-11-19T10:30:01.000Z,192.168.1.100,1,40001,123.45,success
```

## Configuration

### Ping Monitor
- **IP Address**: Target IP address or hostname
- **Interval**: Fixed at 1 second

### Modbus Monitor
- **IP Address**: Modbus TCP device IP
- **Port**: TCP port (default: 502)
- **Device ID**: Modbus unit ID (slave ID)
- **Register Address**: Register to read
- **Register Type**: Holding or Input register
- **Interval**: Fixed at 1 second

## Technologies Used

- **Electron** - Desktop application framework
- **React** - UI library
- **TypeScript** - Type-safe JavaScript
- **Recharts** - Charting library
- **Modbus-serial** - Modbus TCP client
- **Ping** - ICMP ping utility
- **CSV-writer/CSV-parser** - CSV file handling

## License

MIT

