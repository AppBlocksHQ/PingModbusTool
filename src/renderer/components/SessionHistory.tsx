import React, { useState, useEffect } from 'react';
import SessionCard from './SessionCard';
import SessionModal from './SessionModal';

const { ipcRenderer } = window.require('electron');

interface Session {
  filename: string;
  type: 'ping' | 'modbus';
  isActive: boolean;
  recordCount?: number;
}

interface SessionHistoryProps {
  type: 'ping' | 'modbus';
  activeSessions: Set<string>;
  refreshTrigger?: number;
}

const SessionHistory: React.FC<SessionHistoryProps> = ({ type, activeSessions, refreshTrigger }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const extractTimestamp = (filename: string): Date => {
    // Extract timestamp from filename
    // Format: ping_ip_timestamp.csv or modbus_ip_deviceId_registerAddress_timestamp.csv
    const match = filename.match(/_(\d{4}-\d{2}-\d{2}T[\d-]+Z)\.csv$/);
    if (match) {
      // Convert back to ISO format (replace hyphens with colons and dots where needed)
      const isoString = match[1].replace(/T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z/, 'T$1:$2:$3.$4Z');
      return new Date(isoString);
    }
    return new Date(0); // Return epoch if no match (shouldn't happen)
  };

  const loadSessions = async (loadRecordCounts: boolean = false) => {
    try {
      const allSessions = await ipcRenderer.invoke('storage:list-sessions');
      const sessionList = (type === 'ping' ? allSessions.ping : allSessions.modbus).map(
        (filename: string) => ({
          filename,
          type,
          isActive: activeSessions.has(filename)
        })
      );
      // Sort by timestamp (most recent first)
      sessionList.sort((a: Session, b: Session) => {
        const timeA = extractTimestamp(a.filename);
        const timeB = extractTimestamp(b.filename);
        return timeB.getTime() - timeA.getTime();
      });
      
      if (loadRecordCounts) {
        // Load record counts for each session (only on initial load)
        const sessionsWithCounts = await Promise.all(
          sessionList.map(async (session: Session) => {
            try {
              const count = await ipcRenderer.invoke('storage:get-record-count', session.filename);
              return { ...session, recordCount: count };
            } catch (error) {
              console.error(`Failed to load record count for ${session.filename}:`, error);
              return session;
            }
          })
        );
        setSessions(sessionsWithCounts);
      } else {
        // Just update the session list, preserving existing record counts
        setSessions(prevSessions => {
          const countMap = new Map(prevSessions.map(s => [s.filename, s.recordCount]));
          return sessionList.map((session: Session) => ({
            ...session,
            recordCount: countMap.get(session.filename)
          }));
        });
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  // Load sessions with record counts only on initial mount or when type changes
  useEffect(() => {
    loadSessions(true);
  }, [type]);

  // Update isActive status when activeSessions changes (without re-fetching record counts)
  useEffect(() => {
    setSessions(prevSessions => 
      prevSessions.map(session => ({
        ...session,
        isActive: activeSessions.has(session.filename)
      }))
    );
  }, [activeSessions]);

  // Refresh sessions with record counts when refreshTrigger changes (e.g., when a session stops)
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      loadSessions(true);
    }
  }, [refreshTrigger]);

  const handleSessionSelect = async (filename: string) => {
    setSelectedSession(filename);
    setLoading(true);
    setIsModalOpen(true);

    try {
      let data;
      if (type === 'ping') {
        data = await ipcRenderer.invoke('storage:read-ping-session', filename);
      } else {
        data = await ipcRenderer.invoke('storage:read-modbus-session', filename);
      }
      setSessionData(data);
    } catch (error) {
      console.error('Failed to load session data:', error);
      setSessionData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!selectedSession) return;

    try {
      await ipcRenderer.invoke('storage:delete-session', selectedSession);
      setIsModalOpen(false);
      setSelectedSession(null);
      setSessionData([]);
      loadSessions(false); // Reload the session list (no need to re-fetch counts)
    } catch (error) {
      console.error('Failed to delete session:', error);
      alert('Failed to delete session. Please try again.');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSession(null);
    setSessionData([]);
  };

  const handleImport = async () => {
    try {
      const result = await ipcRenderer.invoke('storage:import-session');
      if (result.success) {
        alert(`Session imported successfully:\n${result.filename}`);
        loadSessions(true); // Reload with counts to get the imported session's count
      } else {
        if (result.error !== 'Import canceled') {
          alert(`Failed to import session:\n${result.error}`);
        }
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Failed to import session. Please try again.');
    }
  };

  return (
    <>
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0 }}>Session History</h3>
        <button 
          className="btn btn-secondary" 
          onClick={handleImport}
          style={{ fontSize: '14px', padding: '6px 12px' }}
        >
          Import Session
        </button>
      </div>
      {sessions.length === 0 ? (
        <div className="empty-state">
          <p>No sessions yet</p>
        </div>
      ) : (
        <>
          <div className="session-list">
            {sessions.map((session) => (
              <SessionCard
                key={session.filename}
                filename={session.filename}
                isActive={session.isActive}
                isSelected={selectedSession === session.filename}
                onClick={() => handleSessionSelect(session.filename)}
                recordCount={session.recordCount}
              />
            ))}
          </div>
        </>
      )}

      <SessionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        sessionType={type}
        filename={selectedSession || ''}
        data={sessionData}
        onDelete={handleDeleteSession}
      />
    </div>
    </>
  );
};

export default SessionHistory;

