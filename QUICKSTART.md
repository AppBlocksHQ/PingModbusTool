# Quick Start Guide

## Running the Application

### Option 1: Development Mode (Recommended for First Run)

```bash
npm start
```

This will build the application and launch Electron.

### Option 2: Development with Watch Mode

In one terminal:
```bash
npm run dev
```

In another terminal:
```bash
electron .
```

This allows for auto-rebuild on file changes.

## Using the Ping Monitor

1. Click on the **"Ping Monitor"** tab
2. Enter an IP address or hostname (e.g., `8.8.8.8`, `google.com`, or `192.168.1.1`)
3. Click **"Start New Ping Session"**
4. Watch the real-time statistics:
   - Packets sent/received/lost
   - Loss rate percentage
   - Average response time
   - Live chart of response times
5. Click **"Stop Ping"** to end the session
6. View historical sessions in the sidebar
7. Click on any historical session to view its data and chart

## Using the Modbus Monitor

1. Click on the **"Modbus Monitor"** tab
2. Configure the connection:
   - **IP Address**: The Modbus TCP device IP (e.g., `192.168.1.100`)
   - **Port**: Usually `502` (default Modbus TCP port)
   - **Device ID**: The Modbus unit/slave ID (typically `1`)
   - **Register Address**: The register to read (e.g., `0`, `40001`)
   - **Register Type**: Choose `Holding Register` or `Input Register`
3. Click **"Start New Modbus Session"**
4. Monitor the real-time data:
   - Connection status
   - Successful reads and errors
   - Current register value
   - Live chart of register values over time
5. Click **"Stop Modbus"** to end the session
6. View historical sessions in the sidebar

## Features

### Multiple Sessions
- Run multiple ping or Modbus sessions simultaneously
- Each session is independent and can be stopped individually
- Switch between active sessions using the sidebar

### Data Logging
- All data is automatically logged to CSV files
- CSV files are stored in the application data directory
- Format includes timestamp, values, and status for each reading

### Historical Data
- Access past sessions from the Session History section
- Click on any session to open a detailed modal view
- Modal displays:
  - Complete session statistics (min/max/avg, packet loss, etc.)
  - Full chart of the entire session history
  - Delete button to remove individual sessions
- Delete sessions with confirmation prompt

### Data Storage Location

Your CSV files are stored at:
- **macOS**: `~/Library/Application Support/ping-modbus-monitor/sessions/`
- **Windows**: `%APPDATA%/ping-modbus-monitor/sessions/`
- **Linux**: `~/.config/ping-modbus-monitor/sessions/`

## Testing Tips

### Testing Ping Monitor
- Use `8.8.8.8` or `1.1.1.1` for reliable internet pings
- Use `127.0.0.1` for local testing
- Use your router IP (e.g., `192.168.1.1`) for local network testing

### Testing Modbus Monitor
- You'll need a Modbus TCP server/device to test this feature
- You can use Modbus simulation tools like:
  - ModRSsim2 (Windows)
  - pyModSlave (Python-based)
  - diagslave (Linux/Mac)
- Default Modbus TCP port is `502`
- Most devices use Device ID `1`
- Common register addresses start at `0` or `40001` (holding registers)

## Troubleshooting

### Application Won't Start
- Make sure all dependencies are installed: `npm install`
- Rebuild the project: `npm run build`
- Check for errors in the terminal

### Ping Not Working
- Ensure you have network connectivity
- Some systems require administrator/root privileges for ICMP ping
- Try using a hostname instead of IP, or vice versa

### Modbus Connection Failed
- Verify the IP address and port are correct
- Ensure the Modbus device is powered on and connected to the network
- Check that the Device ID is correct
- Verify the firewall isn't blocking port 502
- Try using a Modbus testing tool to verify the device is responding

### CSV Files Not Saving
- Check that the application has write permissions to the user data directory
- Look for error messages in the developer console (View → Toggle Developer Tools)

## Development

### Project Structure
```
src/
├── main/           # Electron main process
│   ├── main.ts              # Application entry & IPC handlers
│   ├── ping-service.ts      # Ping monitoring logic
│   ├── modbus-service.ts    # Modbus TCP polling logic
│   └── storage-service.ts   # CSV file management
└── renderer/       # React UI
    ├── App.tsx              # Main app component
    ├── index.tsx            # React entry point
    └── components/
        ├── PingMonitor.tsx
        ├── ModbusMonitor.tsx
        ├── LiveChart.tsx
        ├── SessionHistory.tsx
        └── SessionCard.tsx
```

### Key Technologies
- **Electron**: Desktop application framework
- **React**: UI framework
- **TypeScript**: Type-safe development
- **Recharts**: Data visualization
- **Modbus-serial**: Modbus TCP client
- **Ping**: ICMP ping utility

## Next Steps

1. Start the application: `npm start`
2. Test the Ping Monitor with a reliable IP address
3. If you have Modbus devices, test the Modbus Monitor
4. Explore historical sessions and charts
5. Check the CSV files in the data directory

Enjoy monitoring!

