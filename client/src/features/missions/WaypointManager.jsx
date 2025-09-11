import React, { useState } from 'react';

const WaypointManager = ({ waypoints, onWaypointsChange, onRemoveWaypoint, onUpdateWaypoint }) => {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editData, setEditData] = useState({ latitude: '', longitude: '', altitude: '' });

  const handleEdit = (index, waypoint) => {
    setEditingIndex(index);
    setEditData({
      latitude: waypoint.latitude.toString(),
      longitude: waypoint.longitude.toString(),
      altitude: waypoint.altitude.toString()
    });
  };

  const handleSave = () => {
    if (editingIndex !== null) {
      const updatedWaypoints = [...waypoints];
      updatedWaypoints[editingIndex] = {
        latitude: parseFloat(editData.latitude),
        longitude: parseFloat(editData.longitude),
        altitude: parseFloat(editData.altitude)
      };
      onWaypointsChange(updatedWaypoints);
      setEditingIndex(null);
      setEditData({ latitude: '', longitude: '', altitude: '' });
    }
  };

  const handleCancel = () => {
    setEditingIndex(null);
    setEditData({ latitude: '', longitude: '', altitude: '' });
  };

  const moveWaypoint = (index, direction) => {
    const newWaypoints = [...waypoints];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < waypoints.length) {
      [newWaypoints[index], newWaypoints[targetIndex]] = [newWaypoints[targetIndex], newWaypoints[index]];
      onWaypointsChange(newWaypoints);
    }
  };

  return (
    <div className="waypoint-manager">
      <h4>Flight Path Waypoints ({waypoints.length})</h4>
      
      {waypoints.length === 0 ? (
        <p className="no-waypoints">No waypoints defined. Click on the map to add waypoints.</p>
      ) : (
        <div className="waypoint-list">
          {waypoints.map((waypoint, index) => (
            <div key={index} className="waypoint-item">
              {editingIndex === index ? (
                <div className="waypoint-edit">
                  <div className="edit-inputs">
                    <input
                      type="number"
                      step="any"
                      placeholder="Latitude"
                      value={editData.latitude}
                      onChange={(e) => setEditData({...editData, latitude: e.target.value})}
                    />
                    <input
                      type="number"
                      step="any"
                      placeholder="Longitude"
                      value={editData.longitude}
                      onChange={(e) => setEditData({...editData, longitude: e.target.value})}
                    />
                    <input
                      type="number"
                      step="any"
                      placeholder="Altitude"
                      value={editData.altitude}
                      onChange={(e) => setEditData({...editData, altitude: e.target.value})}
                    />
                  </div>
                  <div className="edit-actions">
                    <button onClick={handleSave} className="save-btn">Save</button>
                    <button onClick={handleCancel} className="cancel-btn">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="waypoint-display">
                  <div className="waypoint-info">
                    <span className="waypoint-number">#{index + 1}</span>
                    <span className="waypoint-coords">
                      {waypoint.latitude.toFixed(4)}, {waypoint.longitude.toFixed(4)}
                    </span>
                    <span className="waypoint-altitude">{waypoint.altitude}m</span>
                  </div>
                  <div className="waypoint-actions">
                    <button 
                      onClick={() => moveWaypoint(index, 'up')}
                      disabled={index === 0}
                      className="move-btn"
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button 
                      onClick={() => moveWaypoint(index, 'down')}
                      disabled={index === waypoints.length - 1}
                      className="move-btn"
                      title="Move down"
                    >
                      ↓
                    </button>
                    <button 
                      onClick={() => handleEdit(index, waypoint)}
                      className="edit-btn"
                      title="Edit waypoint"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => onRemoveWaypoint(index)}
                      className="remove-btn"
                      title="Remove waypoint"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {waypoints.length > 0 && (
        <div className="waypoint-summary">
          <p>
            <strong>Total Distance:</strong> {calculateTotalDistance(waypoints).toFixed(2)} km
          </p>
          <p>
            <strong>Estimated Flight Time:</strong> {estimateFlightTime(waypoints)} minutes
          </p>
        </div>
      )}
    </div>
  );
};

// Helper function to calculate total distance between waypoints
const calculateTotalDistance = (waypoints) => {
  if (waypoints.length < 2) return 0;
  
  let totalDistance = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const distance = calculateDistance(
      waypoints[i].latitude,
      waypoints[i].longitude,
      waypoints[i + 1].latitude,
      waypoints[i + 1].longitude
    );
    totalDistance += distance;
  }
  return totalDistance;
};

// Helper function to calculate distance between two points using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Helper function to estimate flight time (assuming average speed of 15 m/s)
const estimateFlightTime = (waypoints) => {
  const totalDistance = calculateTotalDistance(waypoints);
  const averageSpeed = 15; // m/s
  const timeInSeconds = (totalDistance * 1000) / averageSpeed; // Convert km to m
  return Math.round(timeInSeconds / 60); // Convert to minutes
};

export default WaypointManager;
