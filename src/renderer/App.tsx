import React, { useState } from 'react';
import PingMonitor from './components/PingMonitor';
import ModbusMonitor from './components/ModbusMonitor';
import './styles.css';

type TabType = 'ping' | 'modbus';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('ping');

  return (
    <div className="app">
      <header className="app-header">
        <h1>Ping & Modbus TCP Monitor</h1>
        <div className="tab-buttons">
          <button
            className={activeTab === 'ping' ? 'active' : ''}
            onClick={() => setActiveTab('ping')}
          >
            Ping Monitor
          </button>
          <button
            className={activeTab === 'modbus' ? 'active' : ''}
            onClick={() => setActiveTab('modbus')}
          >
            Modbus Monitor
          </button>
        </div>
      </header>
      <main className="app-content">
        <div style={{ display: activeTab === 'ping' ? 'block' : 'none', height: '100%' }}>
          <PingMonitor />
        </div>
        <div style={{ display: activeTab === 'modbus' ? 'block' : 'none', height: '100%' }}>
          <ModbusMonitor />
        </div>
      </main>
    </div>
  );
};

export default App;

