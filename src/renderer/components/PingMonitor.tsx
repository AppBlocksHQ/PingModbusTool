import React, { useState, useEffect, useRef } from 'react';
import LiveChart from './LiveChart';
import SessionHistory from './SessionHistory';

const { ipcRenderer } = window.require('electron');

interface PingData {
  timestamp: string;
  response_time_ms: number | null;
  status: string;
}

interface PingStats {
  sent: number;
  received: number;
  lost: number;
  avgTime: number;
  lossRate: number;
}

interface ActiveSession {
  id: string;
  ip: string;
  data: PingData[];
  stats: PingStats;
}

const PingMonitor: React.FC = () => {
  const [ipAddress, setIpAddress] = useState('');
  const [sessions, setSessions] = useState<Map<string, ActiveSession>>(new Map());
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const sessionCounterRef = useRef(0);

  useEffect(() => {
    const handlePingData = (event: any, payload: any) => {
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

    ipcRenderer.on('ping:data', handlePingData);

    return () => {
      ipcRenderer.removeListener('ping:data', handlePingData);
    };
  }, []);

  const startPing = () => {
    if (!ipAddress.trim()) {
      alert('Please enter an IP address');
      return;
    }

    const sessionId = `ping-${sessionCounterRef.current++}`;
    const newSession: ActiveSession = {
      id: sessionId,
      ip: ipAddress,
      data: [],
      stats: {
        sent: 0,
        received: 0,
        lost: 0,
        avgTime: 0,
        lossRate: 0
      }
    };

    setSessions((prev) => new Map(prev).set(sessionId, newSession));
    setSelectedSessionId(sessionId);
    ipcRenderer.send('ping:start', { sessionId, ip: ipAddress });
  };

  const stopPing = (sessionId: string) => {
    ipcRenderer.send('ping:stop', { sessionId });
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
          <h2>Ping Configuration</h2>
          <div className="form-group">
            <label>IP Address</label>
            <input
              type="text"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
              placeholder="e.g., 192.168.1.1 or google.com"
            />
          </div>
          <div className="button-group">
            <button className="btn btn-primary" onClick={startPing}>
              Start New Ping Session
            </button>
          </div>
        </div>

        {currentSession && (
          <>
            <div className="card">
              <h2>Live Statistics - {currentSession.ip}</h2>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-label">Packets Sent</div>
                  <div className="stat-value">{currentSession.stats.sent}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Packets Received</div>
                  <div className="stat-value success">{currentSession.stats.received}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Packets Lost</div>
                  <div className="stat-value error">{currentSession.stats.lost}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Loss Rate</div>
                  <div className="stat-value">{currentSession.stats.lossRate.toFixed(1)}%</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Average Response Time</div>
                  <div className="stat-value">{currentSession.stats.avgTime.toFixed(2)} ms</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Current Response</div>
                  <div className="stat-value">
                    {currentSession.data.length > 0
                      ? currentSession.data[currentSession.data.length - 1].response_time_ms !== null
                        ? `${currentSession.data[currentSession.data.length - 1].response_time_ms} ms`
                        : 'Timeout'
                      : 'N/A'}
                  </div>
                </div>
              </div>
              <div className="button-group" style={{ marginTop: '15px' }}>
                <button className="btn btn-danger" onClick={() => stopPing(currentSession.id)}>
                  Stop Ping
                </button>
              </div>
            </div>

            <div className="card chart-container">
              <h2>Response Time Chart</h2>
              <div style={{ height: 'calc(100% - 40px)' }}>
                <LiveChart
                  data={currentSession.data.map((d) => ({
                    timestamp: d.timestamp,
                    value: d.response_time_ms
                  }))}
                  dataKey="Response Time (ms)"
                  yAxisLabel="Response Time (ms)"
                  lineColor="#667eea"
                />
              </div>
            </div>
          </>
        )}

        {!currentSession && sessions.size === 0 && (
          <div className="card">
            <div className="empty-state">
              <p>No active ping sessions</p>
              <p>Enter an IP address and click "Start New Ping Session" to begin monitoring</p>
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
                    {session.ip}
                  </div>
                  <div className="session-meta">
                    {session.stats.sent} packets sent
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

        <SessionHistory type="ping" activeSessions={activeSessionFilenames} />
      </div>
    </div>
  );
};

export default PingMonitor;

