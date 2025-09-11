import React, { useState } from 'react';
import api from '../../lib/api';

const MissionForm = () => {
  const [missionName, setMissionName] = useState('');
  const [description, setDescription] = useState('');
  const [altitude, setAltitude] = useState(100);
  const [waypoints, setWaypoints] = useState([]);
  const [surveyArea, setSurveyArea] = useState([]); // GeoJSON Polygon coordinates
  const [dataCollectionFrequency, setDataCollectionFrequency] = useState('medium');
  const [sensors, setSensors] = useState([]);
  const [overlapPercentage, setOverlapPercentage] = useState(70);
  const [missionPattern, setMissionPattern] = useState('manual');
  const [lineSpacing, setLineSpacing] = useState(50);
  const [angle, setAngle] = useState(0);
  const [perimeterOffset, setPerimeterOffset] = useState(10);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [wpLat, setWpLat] = useState('');
  const [wpLng, setWpLng] = useState('');
  const [wpAlt, setWpAlt] = useState('');
  const [areaLat, setAreaLat] = useState('');
  const [areaLng, setAreaLng] = useState('');

  const addWaypoint = () => {
    if (wpLat === '' || wpLng === '' || wpAlt === '') {
      setMessage('Error: Please enter latitude, longitude, and altitude for the waypoint.');
      return;
    }
    const lat = parseFloat(wpLat), lng = parseFloat(wpLng), alt = parseFloat(wpAlt);
    if (Number.isNaN(lat) || Number.isNaN(lng) || Number.isNaN(alt)) {
      setMessage('Error: Waypoint fields must be valid numbers.');
      return;
    }
    const updated = [...waypoints, { latitude: lat, longitude: lng, altitude: alt }];
    setWaypoints(updated);
    setWpLat(''); setWpLng(''); setWpAlt('');
    setMessage('');
  };

  const removeWaypoint = (idx) => {
    setWaypoints(waypoints.filter((_, i) => i !== idx));
  };

  const addAreaPoint = () => {
    if (areaLat === '' || areaLng === '') {
      setMessage('Error: Please enter latitude and longitude for the survey area point.');
      return;
    }
    const lat = parseFloat(areaLat), lng = parseFloat(areaLng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      setMessage('Error: Survey area fields must be valid numbers.');
      return;
    }
    // GeoJSON expects [lng, lat]
    const updated = [...surveyArea, [lng, lat]];
    setSurveyArea(updated);
    setAreaLat(''); setAreaLng('');
    setMessage('');
  };

  const removeAreaPoint = (idx) => {
    setSurveyArea(surveyArea.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (waypoints.length < 2) {
        setMessage('Error: Add at least 2 waypoints.');
        setLoading(false);
        return;
      }
      if (surveyArea.length < 3) {
        setMessage('Error: Define a survey area with at least 3 points.');
        setLoading(false);
        return;
      }
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
        missionPattern,
        patternParameters: {
          lineSpacing: Number(lineSpacing),
          angle: Number(angle),
          perimeterOffset: Number(perimeterOffset)
        },
        status: 'pending'
      };

      const response = await api.post('/api/missions', missionData);
      setMessage('Mission created successfully!');
      console.log('Mission created:', response.data);
      
      // Reset form
      setMissionName('');
      setDescription('');
      setAltitude(100);
      setWaypoints([]);
      setSurveyArea([]);
      setDataCollectionFrequency('medium');
      setSensors([]);
      setOverlapPercentage(70);
    } catch (error) {
      setMessage('Error creating mission: ' + (error.response?.data?.error || error.message));
      console.error('Error creating mission:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mission-form-container">
      <h2>Create New Mission</h2>
      {message && (
        <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}
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

        {/* Survey Area input - will need a map component later */}
        <div className="form-group">
          <label>Survey Area (Polygon):</label>
          <div>
            <div className="input-group">
              <input type="number" step="any" placeholder="Latitude" value={areaLat} onChange={(e) => setAreaLat(e.target.value)} />
              <input type="number" step="any" placeholder="Longitude" value={areaLng} onChange={(e) => setAreaLng(e.target.value)} />
              <button type="button" onClick={addAreaPoint} className="add-btn">Add Point</button>
            </div>
            {surveyArea.length === 0 ? (
              <div className="no-items">No area points added</div>
            ) : (
              surveyArea.map((pt, index) => (
                <div key={index} className="item-row">
                  <div>#{index + 1}: {pt[1]}, {pt[0]}</div>
                  <button type="button" onClick={() => removeAreaPoint(index)} className="remove-btn">Remove</button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Waypoints input - will need a more sophisticated component later */}
        <div className="form-group">
          <label>Waypoints:</label>
          <div>
            <div className="input-group">
              <input type="number" step="any" placeholder="Latitude" value={wpLat} onChange={(e) => setWpLat(e.target.value)} />
              <input type="number" step="any" placeholder="Longitude" value={wpLng} onChange={(e) => setWpLng(e.target.value)} />
              <input type="number" step="any" placeholder="Altitude (m)" value={wpAlt} onChange={(e) => setWpAlt(e.target.value)} />
              <button type="button" onClick={addWaypoint} className="add-btn">Add Waypoint</button>
            </div>
            {waypoints.length === 0 ? (
              <div className="no-items">No waypoints added</div>
            ) : (
              waypoints.map((wp, index) => (
                <div key={index} className="item-row">
                  <div>#{index + 1}: {wp.latitude}, {wp.longitude}, {wp.altitude}m</div>
                  <button type="button" onClick={() => removeWaypoint(index)} className="remove-btn">Remove</button>
                </div>
              ))
            )}
          </div>
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
          <div>
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

        <div className="form-group">
          <label htmlFor="missionPattern">Mission Pattern:</label>
          <select
            id="missionPattern"
            value={missionPattern}
            onChange={(e) => setMissionPattern(e.target.value)}
          >
            <option value="manual">Manual Waypoints</option>
            <option value="crosshatch">Crosshatch Pattern</option>
            <option value="perimeter">Perimeter Pattern</option>
          </select>
        </div>

        {missionPattern === 'crosshatch' && (
          <>
            <div className="form-group">
              <label htmlFor="lineSpacing">Line Spacing (meters):</label>
              <input
                type="number"
                id="lineSpacing"
                value={lineSpacing}
                onChange={(e) => setLineSpacing(e.target.value)}
                min="10"
                max="200"
              />
            </div>
            <div className="form-group">
              <label htmlFor="angle">Angle from North (degrees):</label>
              <input
                type="number"
                id="angle"
                value={angle}
                onChange={(e) => setAngle(e.target.value)}
                min="0"
                max="360"
              />
            </div>
          </>
        )}

        {missionPattern === 'perimeter' && (
          <div className="form-group">
            <label htmlFor="perimeterOffset">Perimeter Offset (meters):</label>
            <input
              type="number"
              id="perimeterOffset"
              value={perimeterOffset}
              onChange={(e) => setPerimeterOffset(e.target.value)}
              min="5"
              max="50"
            />
          </div>
        )}

        <button type="submit" disabled={loading}>
          {loading ? 'Creating Mission...' : 'Create Mission'}
        </button>
      </form>
    </div>
  );
};

export default MissionForm;
