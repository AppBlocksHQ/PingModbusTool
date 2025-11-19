import React, { useState, useEffect, useRef } from 'react';
import LiveChart from './LiveChart';
import SessionHistory from './SessionHistory';

const { ipcRenderer } = window.require('electron');

interface ModbusData {
  timestamp: string;
  value: number | null;
  status: string;
}

interface ModbusStats {
  reads: number;
  errors: number;
  lastValue: number | null;
}

interface ModbusConfig {
  ip: string;
  port: number;
  deviceId: number;
  registerAddress: number;
  registerType: 'holding' | 'input';
}

interface ActiveSession {
  id: string;
  config: ModbusConfig;
  data: ModbusData[];
  stats: ModbusStats;
  connected: boolean;
}

const ModbusMonitor: React.FC = () => {
  const [config, setConfig] = useState<ModbusConfig>({
    ip: '',
    port: 502,
    deviceId: 1,
    registerAddress: 0,
    registerType: 'holding'
  });
  const [sessions, setSessions] = useState<Map<string, ActiveSession>>(new Map());
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const sessionCounterRef = useRef(0);

  useEffect(() => {
    const handleModbusData = (event: any, payload: any) => {
      const { sessionId, record, stats } = payload;
      
      setSessions((prev) => {
        const newSessions = new Map(prev);
        const session = newSessions.get(sessionId);
        if (session) {
          session.data.push(record);
          session.stats = stats;
          newSessions.set(sessionId, { ...session });
        }
        return newSessions;
      });
    };

    const handleModbusConnected = (event: any, payload: any) => {
      const { sessionId } = payload;
      setSessions((prev) => {
        const newSessions = new Map(prev);
        const session = newSessions.get(sessionId);
        if (session) {
          session.connected = true;
          newSessions.set(sessionId, { ...session });
        }
        return newSessions;
      });
    };

    const handleModbusError = (event: any, payload: any) => {
      const { sessionId, error } = payload;
      alert(`Modbus Error (${sessionId}): ${error}`);
      setSessions((prev) => {
        const newSessions = new Map(prev);
        newSessions.delete(sessionId);
        return newSessions;
      });
    };

    ipcRenderer.on('modbus:data', handleModbusData);
    ipcRenderer.on('modbus:connected', handleModbusConnected);
    ipcRenderer.on('modbus:error', handleModbusError);

    return () => {
      ipcRenderer.removeListener('modbus:data', handleModbusData);
      ipcRenderer.removeListener('modbus:connected', handleModbusConnected);
      ipcRenderer.removeListener('modbus:error', handleModbusError);
    };
  }, []);

  const startModbus = () => {
    if (!config.ip.trim()) {
      alert('Please enter an IP address');
      return;
    }

    const sessionId = `modbus-${sessionCounterRef.current++}`;
    const newSession: ActiveSession = {
      id: sessionId,
      config: { ...config },
      data: [],
      stats: {
        reads: 0,
        errors: 0,
        lastValue: null
      },
      connected: false
    };

    setSessions((prev) => new Map(prev).set(sessionId, newSession));
    setSelectedSessionId(sessionId);
    ipcRenderer.send('modbus:start', { sessionId, config });
  };

  const stopModbus = (sessionId: string) => {
    ipcRenderer.send('modbus:stop', { sessionId });
    setSessions((prev) => {
      const newSessions = new Map(prev);
      newSessions.delete(sessionId);
      return newSessions;
    });
    if (selectedSessionId === sessionId) {
      setSelectedSessionId(null);
    }
  };

  const currentSession = selectedSessionId ? sessions.get(selectedSessionId) : null;
  const activeSessionFilenames = new Set<string>();

  return (
    <div className="monitor-container">
      <div className="monitor-main">
        <div className="card">
          <h2>Modbus TCP Configuration</h2>
          <div className="form-group">
            <label>IP Address</label>
            <input
              type="text"
              value={config.ip}
              onChange={(e) => setConfig({ ...config, ip: e.target.value })}
              placeholder="e.g., 192.168.1.100"
            />
          </div>
          <div className="form-group">
            <label>Port</label>
            <input
              type="number"
              value={config.port}
              onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) || 502 })}
            />
          </div>
          <div className="form-group">
            <label>Device ID (Unit ID)</label>
            <input
              type="number"
              value={config.deviceId}
              onChange={(e) => setConfig({ ...config, deviceId: parseInt(e.target.value) || 1 })}
            />
          </div>
          <div className="form-group">
            <label>Register Address</label>
            <input
              type="number"
              value={config.registerAddress}
              onChange={(e) => setConfig({ ...config, registerAddress: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="form-group">
            <label>Register Type</label>
            <select
              value={config.registerType}
              onChange={(e) => setConfig({ ...config, registerType: e.target.value as 'holding' | 'input' })}
            >
              <option value="holding">Holding Register</option>
              <option value="input">Input Register</option>
            </select>
          </div>
          <div className="button-group">
            <button className="btn btn-primary" onClick={startModbus}>
              Start New Modbus Session
            </button>
          </div>
        </div>

        {currentSession && (
          <>
            <div className="card">
              <h2>Live Statistics - {currentSession.config.ip}</h2>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-label">Connection Status</div>
                  <div className={`stat-value ${currentSession.connected ? 'success' : 'error'}`}>
                    {currentSession.connected ? 'Connected' : 'Connecting...'}
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Successful Reads</div>
                  <div className="stat-value success">{currentSession.stats.reads}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Errors</div>
                  <div className="stat-value error">{currentSession.stats.errors}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Current Value</div>
                  <div className="stat-value">
                    {currentSession.stats.lastValue !== null ? currentSession.stats.lastValue : 'N/A'}
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Device ID</div>
                  <div className="stat-value">{currentSession.config.deviceId}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Register Address</div>
                  <div className="stat-value">{currentSession.config.registerAddress}</div>
                </div>
              </div>
              <div className="button-group" style={{ marginTop: '15px' }}>
                <button className="btn btn-danger" onClick={() => stopModbus(currentSession.id)}>
                  Stop Modbus
                </button>
              </div>
            </div>

            <div className="card chart-container">
              <h2>Register Value Chart</h2>
              <div style={{ height: 'calc(100% - 40px)' }}>
                <LiveChart
                  data={currentSession.data.map((d) => ({
                    timestamp: d.timestamp,
                    value: d.value
                  }))}
                  dataKey="Value"
                  yAxisLabel="Register Value"
                  lineColor="#27ae60"
                />
              </div>
            </div>
          </>
        )}

        {!currentSession && sessions.size === 0 && (
          <div className="card">
            <div className="empty-state">
              <p>No active Modbus sessions</p>
              <p>Configure the connection parameters and click "Start New Modbus Session" to begin monitoring</p>
            </div>
          </div>
        )}
      </div>

      <div className="monitor-sidebar">
        <div className="card">
          <h3>Active Sessions</h3>
          {sessions.size > 0 ? (
            <div className="session-list">
              {Array.from(sessions.values()).map((session) => (
                <div
                  key={session.id}
                  className={`session-item ${selectedSessionId === session.id ? 'active' : ''}`}
                  onClick={() => setSelectedSessionId(session.id)}
                >
                  <div className="session-title">
                    <span className="status-indicator active"></span>
                    {session.config.ip}
                  </div>
                  <div className="session-meta">
                    Reg: {session.config.registerAddress} | {session.stats.reads} reads
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No active sessions</p>
            </div>
          )}
        </div>

        <SessionHistory type="modbus" activeSessions={activeSessionFilenames} />
      </div>
    </div>
  );
};

export default ModbusMonitor;

