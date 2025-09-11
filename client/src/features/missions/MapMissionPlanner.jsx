import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../../lib/api';
import WaypointManager from './WaypointManager';

// Fix for default markers in Leaflet with Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const MapMissionPlanner = ({ onMissionCreated }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [mapCenter, setMapCenter] = useState([40.7128, -74.0060]); // Default to NYC
  const [zoom, setZoom] = useState(10);
  
  // Mission planning state
  const [missionName, setMissionName] = useState('');
  const [description, setDescription] = useState('');
  const [altitude, setAltitude] = useState(100);
  const [dataCollectionFrequency, setDataCollectionFrequency] = useState('medium');
  const [sensors, setSensors] = useState([]);
  const [overlapPercentage, setOverlapPercentage] = useState(70);
  
  // Map interaction state
  const [mode, setMode] = useState('waypoints'); // 'waypoints' or 'area'
  const [waypoints, setWaypoints] = useState([]);
  const [surveyArea, setSurveyArea] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPolygon, setCurrentPolygon] = useState(null);
  const [currentPolyline, setCurrentPolyline] = useState(null);
  const waypointMarkersRef = useRef([]);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Initialize map
  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
      mapInstance.current = L.map(mapRef.current).setView(mapCenter, zoom);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstance.current);

      // Add scale control
      L.control.scale().addTo(mapInstance.current);

      // Add click handler for waypoints
      mapInstance.current.on('click', handleMapClick);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  const handleMapClick = (e) => {
    if (mode === 'waypoints') {
      addWaypoint(e.latlng);
    }
  };

  const addWaypoint = (latlng) => {
    const newWaypoint = {
      latitude: latlng.lat,
      longitude: latlng.lng,
      altitude: altitude
    };
    
    const updatedWaypoints = [...waypoints, newWaypoint];
    setWaypoints(updatedWaypoints);
    // Redraw markers with correct numbering and update path
    redrawWaypointMarkers(updatedWaypoints);
    updateFlightPath(updatedWaypoints);
  };

  const redrawWaypointMarkers = (wps) => {
    if (!mapInstance.current) return;
    // Remove existing waypoint markers
    waypointMarkersRef.current.forEach(m => mapInstance.current.removeLayer(m));
    waypointMarkersRef.current = [];
    // Add markers with proper numbering
    wps.forEach((wp, index) => {
      const marker = L.marker([wp.latitude, wp.longitude], {
        icon: L.divIcon({
          className: 'waypoint-marker',
          html: `<div class="waypoint-number">${index + 1}</div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        })
      }).addTo(mapInstance.current);
      marker.bindPopup(`
        <div>
          <h4>Waypoint ${index + 1}</h4>
          <p><strong>Coordinates:</strong> ${wp.latitude.toFixed(4)}, ${wp.longitude.toFixed(4)}</p>
          <p><strong>Altitude:</strong> ${wp.altitude}m</p>
        </div>
      `);
      waypointMarkersRef.current.push(marker);
    });
  };

  const updateFlightPath = (waypoints) => {
    if (currentPolyline) {
      mapInstance.current.removeLayer(currentPolyline);
    }
    
    if (waypoints.length > 1) {
      const path = waypoints.map(wp => [wp.latitude, wp.longitude]);
      const polyline = L.polyline(path, {
        color: '#3498db',
        weight: 3,
        opacity: 0.8
      }).addTo(mapInstance.current);
      setCurrentPolyline(polyline);
    }
  };

  const startAreaDrawing = () => {
    if (currentPolygon) {
      mapInstance.current.removeLayer(currentPolygon);
    }
    
    setMode('area');
    setIsDrawing(true);
    setSurveyArea([]);
    
    // Create a new polygon layer for drawing
    const polygon = L.polygon([], {
      color: '#e74c3c',
      fillColor: '#e74c3c',
      fillOpacity: 0.2,
      weight: 2
    }).addTo(mapInstance.current);
    
    setCurrentPolygon(polygon);
    
    // Add click handler for area drawing
    const clickHandler = (e) => {
      const newArea = [...surveyArea, [e.latlng.lng, e.latlng.lat]]; // GeoJSON format [lng, lat]
      setSurveyArea(newArea);
      polygon.setLatLngs(newArea.map(coord => [coord[1], coord[0]])); // Leaflet format [lat, lng]
    };
    
    mapInstance.current.on('click', clickHandler);
    // Enable double-click to finish (temporarily disable default zoom)
    mapInstance.current.doubleClickZoom.disable();
    mapInstance.current.on('dblclick', finishAreaDrawing);
    
    // Store the handler for cleanup
    polygon._clickHandler = clickHandler;
  };

  const finishAreaDrawing = () => {
    setIsDrawing(false);
    setMode('waypoints');
    
    if (currentPolygon && currentPolygon._clickHandler) {
      mapInstance.current.off('click', currentPolygon._clickHandler);
    }
    if (mapInstance.current) {
      mapInstance.current.off('dblclick', finishAreaDrawing);
      mapInstance.current.doubleClickZoom.enable();
    }
  };

  // UX: guidance and cursor
  useEffect(() => {
    if (!mapInstance.current) return;
    const mapEl = mapInstance.current.getContainer();
    mapEl.classList.add('crosshair-cursor');
    return () => {
      mapEl.classList.remove('crosshair-cursor');
    };
  }, [mode]);

  const clearAll = () => {
    // Clear waypoints
    setWaypoints([]);
    if (currentPolyline) {
      mapInstance.current.removeLayer(currentPolyline);
      setCurrentPolyline(null);
    }
    
    // Clear area
    setSurveyArea([]);
    if (currentPolygon) {
      mapInstance.current.removeLayer(currentPolygon);
      setCurrentPolygon(null);
    }
    
    // Clear all markers
    mapInstance.current.eachLayer(layer => {
      if (layer instanceof L.Marker) {
        mapInstance.current.removeLayer(layer);
      }
    });
  };

  const handleRemoveWaypoint = (index) => {
    const updatedWaypoints = waypoints.filter((_, i) => i !== index);
    setWaypoints(updatedWaypoints);
    updateFlightPath(updatedWaypoints);
    
    redrawWaypointMarkers(updatedWaypoints);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const missionData = {
        name: missionName,
        description,
        altitude: Number(altitude),
        flightPath: waypoints,
        surveyArea: {
          type: 'Polygon',
          coordinates: surveyArea.length > 0 ? [surveyArea] : []
        },
        dataCollectionParameters: {
          frequency: dataCollectionFrequency,
          sensors,
          overlapPercentage: Number(overlapPercentage)
        },
        status: 'pending'
      };

      const response = await api.post('/api/missions', missionData);
      setMessage('Mission created successfully!');
      
      // Reset form
      setMissionName('');
      setDescription('');
      setAltitude(100);
      setWaypoints([]);
      setSurveyArea([]);
      setDataCollectionFrequency('medium');
      setSensors([]);
      setOverlapPercentage(70);
      clearAll();
      
      if (onMissionCreated) {
        onMissionCreated(response.data.data);
      }
    } catch (error) {
      setMessage('Error creating mission: ' + (error.response?.data?.error || error.message));
      console.error('Error creating mission:', error);
    } finally {
      setLoading(false);
    }
  };

  const unmetRequirements = [];
  if (waypoints.length < 2) unmetRequirements.push('Add at least 2 waypoints.');
  if (surveyArea.length < 3) unmetRequirements.push('Define survey area with at least 3 points.');

  return (
    <div className="map-mission-planner">
      <div className="planner-header">
        <h2>Interactive Mission Planner</h2>
        <div className="planner-controls">
          <button 
            className={`mode-btn ${mode === 'waypoints' ? 'active' : ''}`}
            onClick={() => setMode('waypoints')}
          >
            Plan Waypoints
          </button>
          <button 
            className={`mode-btn ${mode === 'area' ? 'active' : ''}`}
            onClick={startAreaDrawing}
          >
            Define Survey Area
          </button>
          <button 
            className="clear-btn"
            onClick={clearAll}
          >
            Clear All
          </button>
          {isDrawing && (
            <button 
              className="finish-btn"
              onClick={finishAreaDrawing}
            >
              Finish Area
            </button>
          )}
        </div>
      </div>

      <div className="planner-content">
        <div className="map-section">
          <div className="map-instructions">
            <p><strong>How to create a mission:</strong></p>
            <ol>
              <li>Click <em>Plan Waypoints</em>, then Left-click on the map to add waypoints (min 2).</li>
              <li>Click <em>Define Survey Area</em>, then Left-click to add polygon points (min 3). Double-click or press <em>Finish Area</em> to complete.</li>
              <li>Fill the form and click <em>Create Mission</em>.</li>
            </ol>
            <p>Tips: Press <em>Esc</em> to cancel area drawing; numbers on markers show the flight order.</p>
          </div>
          <div ref={mapRef} className="mission-map" style={{ height: '500px', width: '100%' }}></div>
        </div>

        <div className="form-section">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="missionName">Mission Name:</label>
              <input
                type="text"
                id="missionName"
                value={missionName}
                onChange={(e) => setMissionName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description:</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>
            </div>

            <div className="form-group">
              <label htmlFor="altitude">Altitude (meters):</label>
              <input
                type="number"
                id="altitude"
                value={altitude}
                onChange={(e) => setAltitude(e.target.value)}
                required
                min="1"
              />
            </div>

            <div className="form-group">
              <label htmlFor="dataCollectionFrequency">Data Collection Frequency:</label>
              <select
                id="dataCollectionFrequency"
                value={dataCollectionFrequency}
                onChange={(e) => setDataCollectionFrequency(e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="form-group">
              <label>Sensors to Use:</label>
              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    value="RGB"
                    checked={sensors.includes('RGB')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSensors([...sensors, 'RGB']);
                      } else {
                        setSensors(sensors.filter((s) => s !== 'RGB'));
                      }
                    }}
                  />
                  RGB
                </label>
                <label>
                  <input
                    type="checkbox"
                    value="Thermal"
                    checked={sensors.includes('Thermal')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSensors([...sensors, 'Thermal']);
                      } else {
                        setSensors(sensors.filter((s) => s !== 'Thermal'));
                      }
                    }}
                  />
                  Thermal
                </label>
                <label>
                  <input
                    type="checkbox"
                    value="LiDAR"
                    checked={sensors.includes('LiDAR')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSensors([...sensors, 'LiDAR']);
                      } else {
                        setSensors(sensors.filter((s) => s !== 'LiDAR'));
                      }
                    }}
                  />
                  LiDAR
                </label>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="overlapPercentage">Overlap Percentage (%):</label>
              <input
                type="number"
                id="overlapPercentage"
                value={overlapPercentage}
                onChange={(e) => setOverlapPercentage(e.target.value)}
                min="0"
                max="100"
              />
            </div>

            <WaypointManager
              waypoints={waypoints}
              onWaypointsChange={setWaypoints}
              onRemoveWaypoint={handleRemoveWaypoint}
            />

            <div className="mission-summary">
              <h4>Mission Summary</h4>
              <p><strong>Waypoints:</strong> {waypoints.length}</p>
              <p><strong>Survey Area:</strong> {surveyArea.length > 0 ? 'Defined' : 'Not defined'}</p>
              <p><strong>Altitude:</strong> {altitude}m</p>
              <p><strong>Sensors:</strong> {sensors.join(', ') || 'None'}</p>
            </div>

            {unmetRequirements.length > 0 && (
              <div className="message error">
                {unmetRequirements.map((m, i) => (<div key={i}>{m}</div>))}
              </div>
            )}
            {message && (
              <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>{message}</div>
            )}

            <button type="submit" disabled={loading || waypoints.length < 2 || surveyArea.length < 3}>
              {loading ? 'Creating Mission...' : 'Create Mission'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MapMissionPlanner;
