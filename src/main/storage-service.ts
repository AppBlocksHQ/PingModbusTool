import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { createObjectCsvWriter } from 'csv-writer';
import csvParser from 'csv-parser';

export interface PingRecord {
  timestamp: string;
  ip: string;
  response_time_ms: number | null;
  status: 'success' | 'timeout' | 'error';
}

export interface ModbusRecord {
  timestamp: string;
  ip: string;
  device_id: number;
  register_address: number;
  value: number | null;
  status: 'success' | 'error';
}

export class StorageService {
  private sessionsDir: string;

  constructor() {
    this.sessionsDir = path.join(app.getPath('userData'), 'sessions');
    this.ensureSessionsDir();
  }

  private ensureSessionsDir(): void {
    if (!fs.existsSync(this.sessionsDir)) {
      fs.mkdirSync(this.sessionsDir, { recursive: true });
    }
  }

  createPingSession(ip: string): { filename: string; writer: any } {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `ping_${ip.replace(/\./g, '_')}_${timestamp}.csv`;
    const filepath = path.join(this.sessionsDir, filename);

    const writer = createObjectCsvWriter({
      path: filepath,
      header: [
        { id: 'timestamp', title: 'timestamp' },
        { id: 'ip', title: 'ip' },
        { id: 'response_time_ms', title: 'response_time_ms' },
        { id: 'status', title: 'status' }
      ]
    });

    return { filename, writer };
  }

  createModbusSession(ip: string, deviceId: number, registerAddress: number): { filename: string; writer: any } {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `modbus_${ip.replace(/\./g, '_')}_${deviceId}_${registerAddress}_${timestamp}.csv`;
    const filepath = path.join(this.sessionsDir, filename);

    const writer = createObjectCsvWriter({
      path: filepath,
      header: [
        { id: 'timestamp', title: 'timestamp' },
        { id: 'ip', title: 'ip' },
        { id: 'device_id', title: 'device_id' },
        { id: 'register_address', title: 'register_address' },
        { id: 'value', title: 'value' },
        { id: 'status', title: 'status' }
      ]
    });

    return { filename, writer };
  }

  async writePingRecord(writer: any, record: PingRecord): Promise<void> {
    await writer.writeRecords([record]);
  }

  async writeModbusRecord(writer: any, record: ModbusRecord): Promise<void> {
    await writer.writeRecords([record]);
  }

  async readPingSession(filename: string): Promise<PingRecord[]> {
    const filepath = path.join(this.sessionsDir, filename);
    const records: PingRecord[] = [];

    return new Promise((resolve, reject) => {
      fs.createReadStream(filepath)
        .pipe(csvParser())
        .on('data', (row: any) => {
          records.push({
            timestamp: row.timestamp,
            ip: row.ip,
            response_time_ms: row.response_time_ms === '' ? null : parseFloat(row.response_time_ms),
            status: row.status as 'success' | 'timeout' | 'error'
          });
        })
        .on('end', () => resolve(records))
        .on('error', reject);
    });
  }

  async readModbusSession(filename: string): Promise<ModbusRecord[]> {
    const filepath = path.join(this.sessionsDir, filename);
    const records: ModbusRecord[] = [];

    return new Promise((resolve, reject) => {
      fs.createReadStream(filepath)
        .pipe(csvParser())
        .on('data', (row: any) => {
          records.push({
            timestamp: row.timestamp,
            ip: row.ip,
            device_id: parseInt(row.device_id),
            register_address: parseInt(row.register_address),
            value: row.value === '' ? null : parseFloat(row.value),
            status: row.status as 'success' | 'error'
          });
        })
        .on('end', () => resolve(records))
        .on('error', reject);
    });
  }

  listSessions(): { ping: string[]; modbus: string[] } {
    const files = fs.readdirSync(this.sessionsDir);
    
    return {
      ping: files.filter(f => f.startsWith('ping_') && f.endsWith('.csv')),
      modbus: files.filter(f => f.startsWith('modbus_') && f.endsWith('.csv'))
    };
  }

  deleteSession(filename: string): void {
    const filepath = path.join(this.sessionsDir, filename);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  }

  exportSession(filename: string, destinationPath: string): void {
    const sourcePath = path.join(this.sessionsDir, filename);
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destinationPath);
    } else {
      throw new Error('Session file not found');
    }
  }

  importSession(sourcePath: string): string {
    const filename = path.basename(sourcePath);
    
    // Validate filename format
    if (!filename.endsWith('.csv') || (!filename.startsWith('ping_') && !filename.startsWith('modbus_'))) {
      throw new Error('Invalid session file format');
    }
    
    const destinationPath = path.join(this.sessionsDir, filename);
    
    // Check if file already exists
    if (fs.existsSync(destinationPath)) {
      throw new Error('A session with this filename already exists');
    }
    
    fs.copyFileSync(sourcePath, destinationPath);
    return filename;
  }
}

