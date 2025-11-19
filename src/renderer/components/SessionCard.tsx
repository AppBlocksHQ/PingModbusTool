import React from 'react';

interface SessionCardProps {
  filename: string;
  isActive: boolean;
  isSelected: boolean;
  onClick: () => void;
}

const SessionCard: React.FC<SessionCardProps> = ({
  filename,
  isActive,
  isSelected,
  onClick
}) => {
  const parseFilename = (filename: string) => {
    // Extract info from filename
    // Format: ping_192_168_1_1_2025-11-19T10-30-00-000Z.csv
    const parts = filename.split('_');
    const type = parts[0];
    
    if (type === 'ping') {
      const ip = `${parts[1]}.${parts[2]}.${parts[3]}.${parts[4]}`;
      const timestampPart = parts.slice(5).join('_').replace('.csv', '');
      return { type, info: ip, timestamp: timestampPart };
    } else if (type === 'modbus') {
      const ip = `${parts[1]}.${parts[2]}.${parts[3]}.${parts[4]}`;
      const deviceId = parts[5];
      const registerAddr = parts[6];
      const timestampPart = parts.slice(7).join('_').replace('.csv', '');
      return {
        type,
        info: `${ip} (ID:${deviceId}, Reg:${registerAddr})`,
        timestamp: timestampPart
      };
    }
    return { type: 'unknown', info: filename, timestamp: '' };
  };

  const { info, timestamp } = parseFilename(filename);

  const formatTimestamp = (ts: string) => {
    try {
      // Convert from: 2025-11-19T10-30-00-000Z to: 2025-11-19T10:30:00.000Z
      const isoString = ts
        .replace(/T(\d+)-(\d+)-(\d+)-(\d+)Z/, 'T$1:$2:$3.$4Z');
      const date = new Date(isoString);
      if (isNaN(date.getTime())) {
        return ts;
      }
      return date.toLocaleString();
    } catch {
      return ts;
    }
  };

  return (
    <div
      className={`session-item ${isSelected ? 'active' : ''} ${!isActive ? 'historical' : ''}`}
      onClick={onClick}
    >
      <div className="session-title">
        <span className={`status-indicator ${isActive ? 'active' : 'stopped'}`}></span>
        {info}
      </div>
      <div className="session-meta">{formatTimestamp(timestamp)}</div>
    </div>
  );
};

export default SessionCard;

