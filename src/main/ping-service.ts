import * as ping from 'ping';
import { BrowserWindow } from 'electron';
import { StorageService, PingRecord } from './storage-service';

export interface PingSession {
  id: string;
  ip: string;
  active: boolean;
  interval: NodeJS.Timeout | null;
  writer: any;
  filename: string;
  stats: {
    sent: number;
    received: number;
    lost: number;
    totalTime: number;
  };
}

export class PingService {
  private sessions: Map<string, PingSession> = new Map();
  private storageService: StorageService;

  constructor(storageService: StorageService) {
    this.storageService = storageService;
  }

  startPing(sessionId: string, ip: string, window: BrowserWindow): void {
    if (this.sessions.has(sessionId)) {
      console.log(`Session ${sessionId} already exists`);
      return;
    }

    const { filename, writer } = this.storageService.createPingSession(ip);

    const session: PingSession = {
      id: sessionId,
      ip,
      active: true,
      interval: null,
      writer,
      filename,
      stats: {
        sent: 0,
        received: 0,
        lost: 0,
        totalTime: 0
      }
    };

    session.interval = setInterval(async () => {
      try {
        session.stats.sent++;
        const res = await ping.promise.probe(ip, {
          timeout: 10,
          extra: ['-i', '1']
        });

        const record: PingRecord = {
          timestamp: new Date().toISOString(),
          ip,
          response_time_ms: res.alive ? parseFloat(res.time) : null,
          status: res.alive ? 'success' : 'timeout'
        };

        if (res.alive) {
          session.stats.received++;
          session.stats.totalTime += parseFloat(res.time);
        } else {
          session.stats.lost++;
        }

        await this.storageService.writePingRecord(session.writer, record);

        window.webContents.send('ping:data', {
          sessionId,
          record,
          stats: {
            ...session.stats,
            avgTime: session.stats.received > 0 ? session.stats.totalTime / session.stats.received : 0,
            lossRate: session.stats.sent > 0 ? (session.stats.lost / session.stats.sent) * 100 : 0
          }
        });
      } catch (error) {
        console.error('Ping error:', error);
        const record: PingRecord = {
          timestamp: new Date().toISOString(),
          ip,
          response_time_ms: null,
          status: 'error'
        };
        session.stats.lost++;
        await this.storageService.writePingRecord(session.writer, record);

        window.webContents.send('ping:data', {
          sessionId,
          record,
          stats: {
            ...session.stats,
            avgTime: session.stats.received > 0 ? session.stats.totalTime / session.stats.received : 0,
            lossRate: session.stats.sent > 0 ? (session.stats.lost / session.stats.sent) * 100 : 0
          }
        });
      }
    }, 1000);

    this.sessions.set(sessionId, session);
  }

  stopPing(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      if (session.interval) {
        clearInterval(session.interval);
        session.interval = null;
      }
      session.active = false;
      this.sessions.delete(sessionId);
      console.log(`Stopped ping session ${sessionId}`);
    }
  }

  getSession(sessionId: string): PingSession | undefined {
    return this.sessions.get(sessionId);
  }

  stopAll(): void {
    this.sessions.forEach((session) => {
      if (session.interval) {
        clearInterval(session.interval);
      }
    });
    this.sessions.clear();
  }
}

