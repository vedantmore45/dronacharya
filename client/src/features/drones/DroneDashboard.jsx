import React, { useState, useEffect } from 'react';
import api from '../../lib/api';

const DroneDashboard = () => {
  const [drones, setDrones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [formMsg, setFormMsg] = useState('');
  const [newDrone, setNewDrone] = useState({
    name: '',
    serialNumber: '',
    model: '',
    status: 'available',
    batteryLevel: 100,
    lastLocationLat: '',
    lastLocationLng: ''
  });

  useEffect(() => {
    fetchDrones();
  }, []);

  const fetchDrones = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/drones');
      setDrones(response.data.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch drones: ' + (err.response?.data?.error || err.message));
      console.error('Error fetching drones:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setFormMsg('');
    try {
      if (!newDrone.name || !newDrone.serialNumber || !newDrone.model) {
        setFormMsg('Error: name, serial number and model are required.');
        setCreating(false);
        return;
      }
      const payload = {
        name: newDrone.name,
        serialNumber: newDrone.serialNumber,
        model: newDrone.model,
        status: newDrone.status,
        batteryLevel: Number(newDrone.batteryLevel),
        lastLocation: (newDrone.lastLocationLat !== '' && newDrone.lastLocationLng !== '') ? {
          type: 'Point',
          coordinates: [
            Number(newDrone.lastLocationLng),
            Number(newDrone.lastLocationLat)
          ]
        } : undefined,
        lastCommunication: new Date()
      };
      await api.post('/api/drones', payload);
      setFormMsg('Drone added successfully');
      setNewDrone({ name: '', serialNumber: '', model: '', status: 'available', batteryLevel: 100, lastLocationLat: '', lastLocationLng: '' });
      await fetchDrones();
    } catch (err) {
      setFormMsg('Error adding drone: ' + (err.response?.data?.error || err.message));
    } finally {
      setCreating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return '#4CAF50';
      case 'in-mission': return '#FF9800';
      case 'charging': return '#2196F3';
      case 'maintenance': return '#F44336';
      case 'offline': return '#9E9E9E';
      default: return '#9E9E9E';
    }
  };

  const getBatteryColor = (batteryLevel) => {
    const lvl = Number.isFinite(Number(batteryLevel)) ? Number(batteryLevel) : 0;
    if (lvl > 50) return '#4CAF50';
    if (lvl > 20) return '#FF9800';
    return '#F44336';
  };

  const getCoordText = (loc) => {
    const coords = loc?.coordinates;
    if (Array.isArray(coords) && coords.length >= 2 &&
        Number.isFinite(coords[0]) && Number.isFinite(coords[1])) {
      const lat = Number(coords[1]).toFixed(4);
      const lng = Number(coords[0]).toFixed(4);
      return `${lat}, ${lng}`;
    }
    return '—';
  };

  if (loading) {
    return <div className="drone-dashboard">Loading drones...</div>;
  }

  if (error) {
    return <div className="drone-dashboard error">Error: {error}</div>;
  }

  return (
    <div className="drone-dashboard">
      <div className="drone-stats">
        <div className="stat-card">
          <h3>Total Drones</h3>
          <span className="stat-number">{drones.length}</span>
        </div>
        <div className="stat-card">
          <h3>Available</h3>
          <span className="stat-number">{drones.filter(d => d.status === 'available').length}</span>
        </div>
        <div className="stat-card">
          <h3>In Mission</h3>
          <span className="stat-number">{drones.filter(d => d.status === 'in-mission').length}</span>
        </div>
        <div className="stat-card">
          <h3>Charging</h3>
          <span className="stat-number">{drones.filter(d => d.status === 'charging').length}</span>
        </div>
      </div>

      <div className="drone-grid">
        {drones.map((drone) => (
          <div key={drone._id} className="drone-card">
            <div className="drone-header">
              <h3>{drone.name}</h3>
              <span 
                className="status-badge" 
                style={{ backgroundColor: getStatusColor(drone.status) }}
              >
                {drone.status === 'available' ? 'Available' : 
                 drone.status === 'in-mission' ? 'In Mission' :
                 drone.status === 'charging' ? 'Charging' :
                 drone.status === 'maintenance' ? 'Maintenance' :
                 drone.status === 'offline' ? 'Offline' : drone.status}
              </span>
            </div>
            
            <div className="drone-details">
              <div className="detail-row">
                <span className="label">Serial:</span>
                <span className="value">{drone.serialNumber}</span>
              </div>
              <div className="detail-row">
                <span className="label">Model:</span>
                <span className="value">{drone.model}</span>
              </div>
              <div className="detail-row">
                <span className="label">Battery:</span>
                <div className="battery-container">
                  <div 
                    className="battery-bar"
                    style={{ 
                      width: `${Number.isFinite(Number(drone.batteryLevel)) ? Number(drone.batteryLevel) : 0}%`,
                      backgroundColor: getBatteryColor(drone.batteryLevel)
                    }}
                  ></div>
                  <span className="battery-text">{Number.isFinite(Number(drone.batteryLevel)) ? Number(drone.batteryLevel) : 0}%</span>
                </div>
              </div>
              {drone.lastLocation && (
                <div className="detail-row">
                  <span className="label">Last Location:</span>
                  <span className="value">{getCoordText(drone.lastLocation)}</span>
                </div>
              )}
              <div className="detail-row">
                <span className="label">Last Communication:</span>
                <span className="value" style={{ whiteSpace: 'nowrap' }}>{drone.lastCommunication ? new Date(drone.lastCommunication).toLocaleString() : '—'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {drones.length === 0 && (
        <div className="no-drones">
          <p>No drones found. Add some drones to get started!</p>
        </div>
      )}

      <div className="mission-form-container" style={{ marginTop: '3rem' }}>
        <h3>Add Drone to Inventory</h3>
        {formMsg && (
          <div className={`message ${formMsg.startsWith('Error') ? 'error' : 'success'}`}>{formMsg}</div>
        )}
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label>Name</label>
            <input value={newDrone.name} onChange={(e) => setNewDrone({ ...newDrone, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Serial Number</label>
            <input value={newDrone.serialNumber} onChange={(e) => setNewDrone({ ...newDrone, serialNumber: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Model</label>
            <input value={newDrone.model} onChange={(e) => setNewDrone({ ...newDrone, model: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Status</label>
            <select value={newDrone.status} onChange={(e) => setNewDrone({ ...newDrone, status: e.target.value })}>
              <option value="available">Available</option>
              <option value="in-mission">In Mission</option>
              <option value="charging">Charging</option>
              <option value="maintenance">Maintenance</option>
              <option value="offline">Offline</option>
            </select>
          </div>
          <div className="form-group">
            <label>Battery Level (%)</label>
            <input type="number" min="0" max="100" value={newDrone.batteryLevel} onChange={(e) => setNewDrone({ ...newDrone, batteryLevel: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Last Location (Lat, Lng)</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="number" step="any" placeholder="Latitude" value={newDrone.lastLocationLat} onChange={(e) => setNewDrone({ ...newDrone, lastLocationLat: e.target.value })} />
              <input type="number" step="any" placeholder="Longitude" value={newDrone.lastLocationLng} onChange={(e) => setNewDrone({ ...newDrone, lastLocationLng: e.target.value })} />
            </div>
          </div>
          <button type="submit" disabled={creating}>{creating ? 'Adding...' : 'Add Drone'}</button>
        </form>
      </div>
    </div>
  );
};

export default DroneDashboard;
