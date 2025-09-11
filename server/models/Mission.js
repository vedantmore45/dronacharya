import mongoose from 'mongoose';

const MissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  surveyArea: {
    type: {
      type: String,
      enum: ['Polygon'],
      required: true,
    },
    coordinates: {
      type: [[[Number]]], // Array of arrays of arrays of numbers for GeoJSON Polygon
      required: true,
    },
  },
  flightPath: [
    {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      altitude: { type: Number, required: true },
      // Optional: speed, camera action, etc.
    },
  ],
  altitude: {
    type: Number,
    required: true,
  },
  dataCollectionParameters: {
    frequency: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    sensors: [{ type: String }], // e.g., ['RGB', 'Thermal', 'LiDAR']
    overlapPercentage: { type: Number, min: 0, max: 100, default: 70 },
  },
  missionPattern: {
    type: String,
    enum: ['manual', 'crosshatch', 'perimeter'],
    default: 'manual',
  },
  patternParameters: {
    // For crosshatch pattern
    lineSpacing: { type: Number, default: 50 }, // meters between parallel lines
    angle: { type: Number, default: 0 }, // degrees from north
    // For perimeter pattern
    perimeterOffset: { type: Number, default: 10 }, // meters inside boundary
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'aborted', 'paused'],
    default: 'pending',
  },
  droneId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Drone',
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  startTime: {
    type: Date,
  },
  endTime: {
    type: Date,
  },
}, { timestamps: true });

export default mongoose.model('Mission', MissionSchema);
