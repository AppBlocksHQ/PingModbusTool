import ModbusRTU from 'modbus-serial';
import { BrowserWindow } from 'electron';
import { StorageService, ModbusRecord } from './storage-service';

export interface ModbusConfig {
  ip: string;
  port: number;
  deviceId: number;
  registerAddress: number;
  registerType: 'holding' | 'input';
}

export interface ModbusSession {
  id: string;
  config: ModbusConfig;
  active: boolean;
  interval: NodeJS.Timeout | null;
  client: ModbusRTU;
  writer: any;
  filename: string;
  connected: boolean;
  reconnecting: boolean;
  consecutiveErrors: number;
  stats: {
    reads: number;
    errors: number;
    lastValue: number | null;
  };
}

export class ModbusService {
  private sessions: Map<string, ModbusSession> = new Map();
  private storageService: StorageService;
  private readonly MAX_CONSECUTIVE_ERRORS = 3;
  private readonly RECONNECT_DELAY = 5000; // 5 seconds

  constructor(storageService: StorageService) {
    this.storageService = storageService;
  }

  private async reconnect(sessionId: string, window: BrowserWindow): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.active || session.reconnecting) {
      return;
    }

    session.reconnecting = true;
    session.connected = false;
    window.webContents.send('modbus:disconnected', { sessionId });

    console.log(`Attempting to reconnect Modbus session ${sessionId}...`);

    try {
      // Close old connection
      try {
        session.client.close(() => {});
      } catch (error) {
        // Ignore close errors
      }

      // Create new client
      const client = new ModbusRTU();
      await client.connectTCP(session.config.ip, { port: session.config.port });
      client.setID(session.config.deviceId);
      client.setTimeout(5000);

      // Update session with new client
      session.client = client;
      session.connected = true;
      session.reconnecting = false;
      session.consecutiveErrors = 0;

      window.webContents.send('modbus:reconnected', { sessionId });
      console.log(`Modbus session ${sessionId} reconnected successfully`);
    } catch (error) {
      console.error(`Failed to reconnect Modbus session ${sessionId}:`, error);
      session.reconnecting = false;

      // Schedule another reconnection attempt if still active
      if (session.active) {
        setTimeout(() => {
          this.reconnect(sessionId, window);
        }, this.RECONNECT_DELAY);
      }
    }
  }

  async startModbus(sessionId: string, config: ModbusConfig, window: BrowserWindow): Promise<void> {
    if (this.sessions.has(sessionId)) {
      console.log(`Modbus session ${sessionId} already exists`);
      return;
    }

    const client = new ModbusRTU();
    const { filename, writer } = this.storageService.createModbusSession(
      config.ip,
      config.deviceId,
      config.registerAddress
    );

    try {
      await client.connectTCP(config.ip, { port: config.port });
      client.setID(config.deviceId);
      client.setTimeout(5000);

      const session: ModbusSession = {
        id: sessionId,
        config,
        active: true,
        interval: null,
        client,
        writer,
        filename,
        connected: true,
        reconnecting: false,
        consecutiveErrors: 0,
        stats: {
          reads: 0,
          errors: 0,
          lastValue: null
        }
      };

      session.interval = setInterval(async () => {
        // Skip if reconnecting
        if (session.reconnecting || !session.connected) {
          return;
        }

        try {
          let value: number | null = null;
          
          if (config.registerType === 'holding') {
            const data = await session.client.readHoldingRegisters(config.registerAddress, 1);
            value = data.data[0];
          } else {
            const data = await session.client.readInputRegisters(config.registerAddress, 1);
            value = data.data[0];
          }

          // Reset consecutive errors on success
          session.consecutiveErrors = 0;
          session.stats.reads++;
          session.stats.lastValue = value;

          const record: ModbusRecord = {
            timestamp: new Date().toISOString(),
            ip: config.ip,
            device_id: config.deviceId,
            register_address: config.registerAddress,
            value,
            status: 'success'
          };

          await this.storageService.writeModbusRecord(session.writer, record);

          window.webContents.send('modbus:data', {
            sessionId,
            record,
            stats: session.stats,
            connected: session.connected
          });
        } catch (error) {
          console.error('Modbus read error:', error);
          session.stats.errors++;
          session.consecutiveErrors++;

          const record: ModbusRecord = {
            timestamp: new Date().toISOString(),
            ip: config.ip,
            device_id: config.deviceId,
            register_address: config.registerAddress,
            value: null,
            status: 'error'
          };

          await this.storageService.writeModbusRecord(session.writer, record);

          window.webContents.send('modbus:data', {
            sessionId,
            record,
            stats: session.stats,
            connected: session.connected
          });

          // Trigger reconnection if too many consecutive errors
          if (session.consecutiveErrors >= this.MAX_CONSECUTIVE_ERRORS && !session.reconnecting) {
            console.log(`Modbus session ${sessionId}: Too many consecutive errors, attempting reconnect`);
            this.reconnect(sessionId, window);
          }
        }
      }, 1000);

      this.sessions.set(sessionId, session);
      
      window.webContents.send('modbus:connected', { sessionId });
    } catch (error) {
      console.error('Modbus connection error:', error);
      window.webContents.send('modbus:error', { 
        sessionId, 
        error: `Failed to connect to ${config.ip}:${config.port}` 
      });
      throw error;
    }
  }

  async stopModbus(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      if (session.interval) {
        clearInterval(session.interval);
        session.interval = null;
      }
      session.active = false;
      
      try {
        session.client.close(() => {
          console.log(`Stopped Modbus session ${sessionId}`);
        });
      } catch (error) {
        console.error('Error closing Modbus connection:', error);
      }
    }
  }

  getSession(sessionId: string): ModbusSession | undefined {
    return this.sessions.get(sessionId);
  }

  async stopAll(): Promise<void> {
    this.sessions.forEach((session) => {
      if (session.interval) {
        clearInterval(session.interval);
      }
      try {
        session.client.close(() => {
          // Connection closed
        });
      } catch (error) {
        console.error('Error closing Modbus connection:', error);
      }
    });
    this.sessions.clear();
  }
}

