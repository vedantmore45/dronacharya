import mongoose from 'mongoose';

const TelemetrySchema = new mongoose.Schema({
  droneId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Drone',
    required: true,
  },
  missionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mission',
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  altitude: {
    type: Number,
    required: true,
  },
  speed: {
    type: Number,
    default: 0,
  },
  batteryLevel: {
    type: Number,
    min: 0,
    max: 100,
    required: true,
  },
  missionStatus: {
    type: String,
    enum: ['starting', 'in progress', 'completed', 'aborted', 'paused'],
    default: 'in progress',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

export default mongoose.model('Telemetry', TelemetrySchema);
