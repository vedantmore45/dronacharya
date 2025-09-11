import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

// Fix for default markers in Leaflet with Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const DroneMap = ({ missions = [], telemetry = [], selectedMission = null }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef({});
  const pathsRef = useRef({});
  const animationRef = useRef({});
  const [mapCenter, setMapCenter] = useState([40.7128, -74.0060]); // Default to NYC
  const [zoom, setZoom] = useState(10);

  // Initialize map
  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
      mapInstance.current = L.map(mapRef.current).setView(mapCenter, zoom);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstance.current);

      // Add scale control
      L.control.scale().addTo(mapInstance.current);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Update map center when missions change
  useEffect(() => {
    if (missions.length > 0 && mapInstance.current) {
      const bounds = [];
      missions.forEach(mission => {
        if (mission.surveyArea && mission.surveyArea.coordinates && mission.surveyArea.coordinates[0]) {
          mission.surveyArea.coordinates[0].forEach(coord => {
            bounds.push([coord[1], coord[0]]); // Leaflet expects [lat, lng]
          });
        }
        if (mission.flightPath && mission.flightPath.length > 0) {
          mission.flightPath.forEach(waypoint => {
            bounds.push([waypoint.latitude, waypoint.longitude]);
          });
        }
      });
      
      if (bounds.length > 0) {
        mapInstance.current.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [missions]);

  // Draw mission areas and flight paths
  useEffect(() => {
    if (!mapInstance.current) return;

    // Clear existing mission overlays
    Object.values(pathsRef.current).forEach(path => {
      mapInstance.current.removeLayer(path);
    });
    pathsRef.current = {};

    missions.forEach(mission => {
      const missionId = mission._id;
      
      // Draw survey area if available
      if (mission.surveyArea && mission.surveyArea.coordinates && mission.surveyArea.coordinates[0]) {
        const polygon = L.polygon(mission.surveyArea.coordinates[0].map(coord => [coord[1], coord[0]]), {
          color: getStatusColor(mission.status),
          fillColor: getStatusColor(mission.status),
          fillOpacity: 0.2,
          weight: 2
        }).addTo(mapInstance.current);
        
        polygon.bindPopup(`
          <div>
            <h4>${mission.name}</h4>
            <p><strong>Status:</strong> ${mission.status}</p>
            <p><strong>Description:</strong> ${mission.description || 'No description'}</p>
            <p><strong>Altitude:</strong> ${mission.altitude}m</p>
          </div>
        `);
        
        pathsRef.current[`${missionId}_area`] = polygon;
      }

      // Draw flight path if available
      if (mission.flightPath && mission.flightPath.length > 0) {
        const waypoints = mission.flightPath.map(wp => [wp.latitude, wp.longitude]);
        const polyline = L.polyline(waypoints, {
          color: getStatusColor(mission.status),
          weight: 3,
          opacity: 0.8
        }).addTo(mapInstance.current);
        
        // Add waypoint markers
        waypoints.forEach((waypoint, index) => {
          const marker = L.marker(waypoint, {
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
              <p><strong>Mission:</strong> ${mission.name}</p>
              <p><strong>Coordinates:</strong> ${waypoint[0].toFixed(4)}, ${waypoint[1].toFixed(4)}</p>
              <p><strong>Altitude:</strong> ${mission.flightPath[index].altitude}m</p>
            </div>
          `);
          
          pathsRef.current[`${missionId}_waypoint_${index}`] = marker;
        });
        
        pathsRef.current[`${missionId}_path`] = polyline;
      }
    });
  }, [missions]);

  // Animate drone through waypoints for in-progress missions
  useEffect(() => {
    if (!mapInstance.current) return;

    // Clear existing animations
    Object.values(animationRef.current).forEach(animation => {
      clearInterval(animation);
    });
    animationRef.current = {};

    // Find in-progress missions
    const inProgressMissions = missions.filter(m => m.status === 'in_progress' && m.flightPath && m.flightPath.length > 0);
    
    inProgressMissions.forEach(mission => {
      const waypoints = mission.flightPath.map(wp => [wp.latitude, wp.longitude]);
      let currentWaypointIndex = 0;
      
      // Create animated drone marker
      const droneIcon = L.divIcon({
        className: 'drone-marker animated',
        html: `
          <div class="drone-icon animated-drone" style="background-color: #4CAF50">
            <div class="drone-arrow"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const droneMarker = L.marker(waypoints[0], { icon: droneIcon }).addTo(mapInstance.current);
      
      droneMarker.bindPopup(`
        <div>
          <h4>Mission: ${mission.name}</h4>
          <p><strong>Status:</strong> In Progress</p>
          <p><strong>Progress:</strong> ${Math.round((currentWaypointIndex / (waypoints.length - 1)) * 100)}%</p>
          <p><strong>Current Waypoint:</strong> ${currentWaypointIndex + 1} of ${waypoints.length}</p>
        </div>
      `);
      
      markersRef.current[`animated_${mission._id}`] = droneMarker;

      // Animate drone through waypoints
      const animateDrone = () => {
        if (currentWaypointIndex < waypoints.length - 1) {
          currentWaypointIndex++;
          const nextWaypoint = waypoints[currentWaypointIndex];
          
          // Smooth transition to next waypoint
          droneMarker.setLatLng(nextWaypoint);
          droneMarker.getPopup().setContent(`
            <div>
              <h4>Mission: ${mission.name}</h4>
              <p><strong>Status:</strong> In Progress</p>
              <p><strong>Progress:</strong> ${Math.round((currentWaypointIndex / (waypoints.length - 1)) * 100)}%</p>
              <p><strong>Current Waypoint:</strong> ${currentWaypointIndex + 1} of ${waypoints.length}</p>
            </div>
          `);
        } else {
          // Mission completed, remove animation
          clearInterval(animationRef.current[mission._id]);
          delete animationRef.current[mission._id];
        }
      };

      // Start animation (move to next waypoint every 3 seconds)
      animationRef.current[mission._id] = setInterval(animateDrone, 3000);
    });
  }, [missions]);

  // Update drone positions from telemetry
  useEffect(() => {
    if (!mapInstance.current) return;

    // Clear existing drone markers (except animated ones)
    Object.entries(markersRef.current).forEach(([key, marker]) => {
      if (!key.startsWith('animated_')) {
        mapInstance.current.removeLayer(marker);
        delete markersRef.current[key];
      }
    });

    // Group telemetry by drone ID and get latest position for each drone
    const latestTelemetry = {};
    telemetry.forEach(t => {
      if (!latestTelemetry[t.droneId] || new Date(t.timestamp) > new Date(latestTelemetry[t.droneId].timestamp)) {
        latestTelemetry[t.droneId] = t;
      }
    });

    // Add drone markers for non-animated drones
    Object.values(latestTelemetry).forEach(t => {
      if (t.location && t.location.coordinates) {
        const [lng, lat] = t.location.coordinates;
        const droneIcon = L.divIcon({
          className: 'drone-marker',
          html: `
            <div class="drone-icon" style="background-color: ${getBatteryColor(t.batteryLevel)}">
              <div class="drone-arrow"></div>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const marker = L.marker([lat, lng], { icon: droneIcon }).addTo(mapInstance.current);
        
        marker.bindPopup(`
          <div>
            <h4>Drone ${t.droneId}</h4>
            <p><strong>Status:</strong> ${t.missionStatus}</p>
            <p><strong>Battery:</strong> ${t.batteryLevel}%</p>
            <p><strong>Altitude:</strong> ${t.altitude}m</p>
            <p><strong>Speed:</strong> ${t.speed} km/h</p>
            <p><strong>Last Update:</strong> ${new Date(t.timestamp).toLocaleString()}</p>
          </div>
        `);
        
        markersRef.current[t.droneId] = marker;
      }
    });
  }, [telemetry]);

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

  const getBatteryColor = (batteryLevel) => {
    if (batteryLevel > 50) return '#4CAF50';
    if (batteryLevel > 20) return '#FF9800';
    return '#F44336';
  };

  return (
    <div className="drone-map-container">
      <div className="map-controls">
        <h3>Mission Map</h3>
        <div className="map-legend">
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#4CAF50' }}></div>
            <span>In Progress</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#FF9800' }}></div>
            <span>Pending</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#2196F3' }}></div>
            <span>Completed</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#F44336' }}></div>
            <span>Aborted</span>
          </div>
        </div>
      </div>
      <div ref={mapRef} className="drone-map" style={{ height: '400px', width: '80%', margin: '0 auto' }}></div>
    </div>
  );
};

export default DroneMap;
