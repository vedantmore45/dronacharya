import mongoose from 'mongoose';

const DroneSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  serialNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  model: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['available', 'in-mission', 'charging', 'maintenance', 'offline'],
    default: 'available',
  },
  batteryLevel: {
    type: Number,
    min: 0,
    max: 100,
    default: 100,
  },
  lastLocation: {
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: {
      type: [Number],
    },
  },
  lastCommunication: {
    type: Date,
    default: Date.now,
  },
  assignedMission: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mission',
  },
}, { timestamps: true });

export default mongoose.model('Drone', DroneSchema);
