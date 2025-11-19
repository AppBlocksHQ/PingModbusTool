import React from 'react';
import LiveChart from './LiveChart';

interface SessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionType: 'ping' | 'modbus';
  filename: string;
  data: any[];
  onDelete: () => void;
}

const SessionModal: React.FC<SessionModalProps> = ({
  isOpen,
  onClose,
  sessionType,
  filename,
  data,
  onDelete
}) => {
  if (!isOpen) return null;

  const getChartData = () => {
    if (sessionType === 'ping') {
      return data.map((record) => ({
        timestamp: record.timestamp,
        value: record.response_time_ms
      }));
    } else {
      return data.map((record) => ({
        timestamp: record.timestamp,
        value: record.value
      }));
    }
  };

  const calculateStats = () => {
    if (sessionType === 'ping') {
      const validRecords = data.filter(r => r.response_time_ms !== null);
      const totalRecords = data.length;
      const successfulRecords = validRecords.length;
      const failedRecords = totalRecords - successfulRecords;
      const avgResponseTime = successfulRecords > 0
        ? validRecords.reduce((sum, r) => sum + r.response_time_ms, 0) / successfulRecords
        : 0;
      const minResponseTime = successfulRecords > 0
        ? Math.min(...validRecords.map(r => r.response_time_ms))
        : 0;
      const maxResponseTime = successfulRecords > 0
        ? Math.max(...validRecords.map(r => r.response_time_ms))
        : 0;

      return {
        totalRecords,
        successfulRecords,
        failedRecords,
        avgResponseTime: avgResponseTime.toFixed(2),
        minResponseTime: minResponseTime.toFixed(2),
        maxResponseTime: maxResponseTime.toFixed(2),
        lossRate: ((failedRecords / totalRecords) * 100).toFixed(1)
      };
    } else {
      const validRecords = data.filter(r => r.value !== null);
      const totalRecords = data.length;
      const successfulRecords = validRecords.length;
      const failedRecords = totalRecords - successfulRecords;
      const avgValue = successfulRecords > 0
        ? validRecords.reduce((sum, r) => sum + r.value, 0) / successfulRecords
        : 0;
      const minValue = successfulRecords > 0
        ? Math.min(...validRecords.map(r => r.value))
        : 0;
      const maxValue = successfulRecords > 0
        ? Math.max(...validRecords.map(r => r.value))
        : 0;

      return {
        totalRecords,
        successfulRecords,
        failedRecords,
        avgValue: avgValue.toFixed(2),
        minValue: minValue.toFixed(2),
        maxValue: maxValue.toFixed(2)
      };
    }
  };

  const stats = calculateStats();

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete this session?\n\n${filename}\n\nThis action cannot be undone.`)) {
      onDelete();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Session Details</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        
        <div className="modal-body">
          <div className="modal-info">
            <strong>File:</strong> {filename}
          </div>

          <div className="card" style={{ marginTop: '20px' }}>
            <h3>Statistics</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-label">Total Records</div>
                <div className="stat-value">{stats.totalRecords}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Successful</div>
                <div className="stat-value success">{stats.successfulRecords}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Failed</div>
                <div className="stat-value error">{stats.failedRecords}</div>
              </div>
              {sessionType === 'ping' ? (
                <>
                  <div className="stat-item">
                    <div className="stat-label">Loss Rate</div>
                    <div className="stat-value">{stats.lossRate}%</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">Avg Response Time</div>
                    <div className="stat-value">{stats.avgResponseTime} ms</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">Min Response Time</div>
                    <div className="stat-value">{stats.minResponseTime} ms</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">Max Response Time</div>
                    <div className="stat-value">{stats.maxResponseTime} ms</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="stat-item">
                    <div className="stat-label">Average Value</div>
                    <div className="stat-value">{stats.avgValue}</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">Min Value</div>
                    <div className="stat-value">{stats.minValue}</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">Max Value</div>
                    <div className="stat-value">{stats.maxValue}</div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="card" style={{ marginTop: '20px', height: '400px' }}>
            <h3>Chart</h3>
            <div style={{ height: 'calc(100% - 40px)' }}>
              <LiveChart
                data={getChartData()}
                dataKey={sessionType === 'ping' ? 'Response Time (ms)' : 'Value'}
                yAxisLabel={sessionType === 'ping' ? 'Response Time (ms)' : 'Register Value'}
                lineColor={sessionType === 'ping' ? '#667eea' : '#27ae60'}
              />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-danger" onClick={handleDelete}>
            Delete Session
          </button>
          <button className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionModal;

