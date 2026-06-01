import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { subscribeTelemetry } from '../../lib/socket';
import DroneMap from '../map/DroneMap';

const MissionMonitoring = () => {
  const [missions, setMissions] = useState([]);
  const [telemetry, setTelemetry] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMissions();
    fetchTelemetry();

    const unsubscribe = subscribeTelemetry((data) => {
      setTelemetry((prev) => [data, ...prev.slice(0, 99)]);
    });

    return unsubscribe;
  }, []);

  const fetchMissions = async () => {
    try {
      const response = await api.get('/api/missions');
      setMissions(response.data.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch missions: ' + (err.response?.data?.error || err.message));
      console.error('Error fetching missions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTelemetry = async () => {
    try {
      const response = await api.get('/api/telemetry');
      setTelemetry(response.data.data.slice(0, 50)); // Get last 50 telemetry records
    } catch (err) {
      console.error('Error fetching telemetry:', err);
    }
  };

  const handleMissionAction = async (missionId, action) => {
    try {
      await api.put(`/api/missions/${missionId}/${action}`);
      fetchMissions(); // Refresh missions after action
    } catch (err) {
      setError(`Failed to ${action} mission: ` + (err.response?.data?.error || err.message));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#FF9800';
      case 'in_progress': return '#4CAF50';
      case 'completed': return '#2196F3';
      case 'aborted': return '#F44336';
      case 'paused': return '#FF5722';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'aborted': return 'Aborted';
      case 'paused': return 'Paused';
      default: return 'Unknown';
    }
  };

  const getProgressPct = (mission) => {
    if (!mission.startTime) return 0;
    
    // For demo purposes, use elapsed time as progress indicator
    if (mission.status === 'in_progress') {
      const now = new Date();
      const start = new Date(mission.startTime);
      const elapsed = now - start;
      
      // Assume missions take 30-60 minutes on average for demo
      const estimatedDuration = 45 * 60 * 1000; // 45 minutes in milliseconds
      return Math.min(100, Math.floor((elapsed / estimatedDuration) * 100));
    } else if (mission.status === 'completed') {
      return 100;
    }
    
    return 0;
  };

  const getEta = (mission) => {
    if (!mission.startTime || mission.status !== 'in_progress') return '—';
    
    const now = new Date();
    const start = new Date(mission.startTime);
    const elapsed = now - start;
    
    // Assume missions take 45 minutes on average for demo
    const estimatedDuration = 45 * 60 * 1000; // 45 minutes in milliseconds
    const remaining = estimatedDuration - elapsed;
    
    if (remaining <= 0) return 'Should be completed';
    
    const totalMinutes = Math.floor(remaining / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return hours > 0 ? `${hours}h ${minutes}m remaining` : `${minutes}m remaining`;
  };

  const formatDuration = (startTime, endTime) => {
    if (!startTime) return 'Not started';
    if (!endTime) return 'In progress';
    const duration = new Date(endTime) - new Date(startTime);
    const minutes = Math.floor(duration / 60000);
    const hours = Math.floor(minutes / 60);
    return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
  };

  if (loading) {
    return <div className="mission-monitoring">Loading missions...</div>;
  }

  return (
    <div className="mission-monitoring">
      {error && (
        <div className="error-message">{error}</div>
      )}

      {/* Interactive Map */}
      <DroneMap 
        missions={missions} 
        telemetry={telemetry} 
      />

      <div className="missions-grid">
        {missions.map((mission) => (
          <div key={mission._id} className="mission-card">
            <div className="mission-header">
              <h3>{mission.name}</h3>
            <span
              className="status-badge"
              style={{ backgroundColor: getStatusColor(mission.status) }}
            >
              {getStatusText(mission.status)}
            </span>
            </div>

            <div className="mission-details">
              <p><strong>Description:</strong> {mission.description || 'No description'}</p>
              <p><strong>Altitude:</strong> {mission.altitude}m</p>
              <p><strong>Duration:</strong> {formatDuration(mission.startTime, mission.endTime)}</p>
              <p><strong>Waypoints:</strong> {mission.flightPath?.length || 0}</p>
              <p><strong>Sensors:</strong> {mission.dataCollectionParameters?.sensors?.join(', ') || 'None'}</p>
              <p><strong>Progress:</strong> {getProgressPct(mission)}%</p>
              <p><strong>ETA:</strong> {getEta(mission)}</p>
            </div>

            <div className="mission-actions">
              {mission.status === 'pending' && (
                <button 
                  onClick={() => handleMissionAction(mission._id, 'start')}
                  className="action-btn start"
                >
                  Start Mission
                </button>
              )}
              {mission.status === 'in_progress' && (
                <>
                  <button 
                    onClick={() => handleMissionAction(mission._id, 'pause')}
                    className="action-btn pause"
                  >
                    Pause
                  </button>
                  <button 
                    onClick={() => handleMissionAction(mission._id, 'abort')}
                    className="action-btn abort"
                  >
                    Abort
                  </button>
                  <button 
                    onClick={() => handleMissionAction(mission._id, 'complete')}
                    className="action-btn resume"
                  >
                    Complete
                  </button>
                </>
              )}
              {mission.status === 'paused' && (
                <button 
                  onClick={() => handleMissionAction(mission._id, 'resume')}
                  className="action-btn resume"
                >
                  Resume
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Telemetry list removed per request; map already visualizes real-time */}

      {missions.length === 0 && (
        <div className="no-missions">
          <p>No missions found. Create a new mission to get started!</p>
        </div>
      )}
    </div>
  );
};

export default MissionMonitoring;
