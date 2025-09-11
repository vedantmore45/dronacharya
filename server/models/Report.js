import mongoose from 'mongoose';

const ReportSchema = new mongoose.Schema({
  missionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mission',
    required: false, // Not required for overall organization reports
  },
  droneId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Drone',
    required: false, // Not required for overall organization reports
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reportType: {
    type: String,
    enum: ['mission_summary', 'overall_org'],
    required: true,
  },
  reportDate: {
    type: Date,
    default: Date.now,
  },
  summary: {
    type: String,
    trim: true,
  },
  flightStatistics: {
    duration: { type: Number, default: 0 }, // in minutes
    distance: { type: Number, default: 0 }, // in kilometers
    coverage: { type: Number, default: 0 }, // in percentage
    maxAltitude: { type: Number, default: 0 }, // in meters
    avgSpeed: { type: Number, default: 0 }, // in km/h
  },
  overallOrgStatistics: {
    totalSurveysDone: { type: Number, default: 0 },
    totalFlightHours: { type: Number, default: 0 },
    totalAreaCovered: { type: Number, default: 0 }, // in square kilometers
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  status: {
    type: String,
    enum: ['generated', 'pending_review', 'approved'],
    default: 'generated',
  },
}, { timestamps: true });

export default mongoose.model('Report', ReportSchema);
