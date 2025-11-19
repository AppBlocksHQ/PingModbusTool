import React, { useState, useEffect } from 'react';
import SessionCard from './SessionCard';
import SessionModal from './SessionModal';

const { ipcRenderer } = window.require('electron');

interface Session {
  filename: string;
  type: 'ping' | 'modbus';
  isActive: boolean;
}

interface SessionHistoryProps {
  type: 'ping' | 'modbus';
  activeSessions: Set<string>;
}

const SessionHistory: React.FC<SessionHistoryProps> = ({ type, activeSessions }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadSessions();
  }, [type, activeSessions]);

  const loadSessions = async () => {
    try {
      const allSessions = await ipcRenderer.invoke('storage:list-sessions');
      const sessionList = (type === 'ping' ? allSessions.ping : allSessions.modbus).map(
        (filename: string) => ({
          filename,
          type,
          isActive: activeSessions.has(filename)
        })
      );
      setSessions(sessionList.reverse()); // Most recent first
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

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
      loadSessions(); // Reload the session list
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

  return (
    <>
    <div className="card">
      <h3>Session History</h3>
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

