import React, { useEffect, useState } from 'react'
import './App.css'
import MissionForm from './features/missions/MissionForm'
import DroneDashboard from './features/drones/DroneDashboard'
import MissionMonitoring from './features/missions/MissionMonitoring'
import ReportsDashboard from './features/reports/ReportsDashboard'

function App() {
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('activeTab') || 'missions')

  const renderContent = () => {
    switch (activeTab) {
      case 'missions':
        return <MissionForm />;
      case 'drones':
        return <DroneDashboard />;
      case 'monitoring':
        return <MissionMonitoring />;
      case 'reports':
        return <ReportsDashboard />;
      default:
        return <MissionForm />;
    }
  }

  useEffect(() => { localStorage.setItem('activeTab', activeTab) }, [activeTab])

  return (
    <div className="app">
      <header className="app-header">
        <h1>
          <div className="logo">D</div>
          Dronacharya - Drone Management Platform
        </h1>
        <nav className="nav-tabs">
          <button 
            className={activeTab === 'missions' ? 'active' : ''}
            onClick={() => setActiveTab('missions')}
          >
            Mission Planning
          </button>
          <button 
            className={activeTab === 'drones' ? 'active' : ''}
            onClick={() => setActiveTab('drones')}
          >
            Drone Fleet
          </button>
          <button 
            className={activeTab === 'monitoring' ? 'active' : ''}
            onClick={() => setActiveTab('monitoring')}
          >
            Mission Monitoring
          </button>
          <button 
            className={activeTab === 'reports' ? 'active' : ''}
            onClick={() => setActiveTab('reports')}
          >
            Reports & Analytics
          </button>
        </nav>
      </header>
      
      <main className="app-main">
        {renderContent()}
      </main>
    </div>
  )
}

export default App
