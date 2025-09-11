import Telemetry from '../models/Telemetry.js';

// @desc    Create new telemetry data
// @route   POST /api/telemetry
// @access  Private
const createTelemetry = (io) => async (req, res) => {
  try {
    const telemetry = await Telemetry.create(req.body);
    io.emit('telemetryUpdate', telemetry); // Emit real-time update
    res.status(201).json({ success: true, data: telemetry });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Get all telemetry data
// @route   GET /api/telemetry
// @access  Private
const getTelemetry = async (req, res) => {
  try {
    const telemetry = await Telemetry.find();
    res.status(200).json({ success: true, count: telemetry.length, data: telemetry });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get telemetry data by drone ID
// @route   GET /api/telemetry/drone/:droneId
// @access  Private
const getTelemetryByDroneId = async (req, res) => {
  try {
    const telemetry = await Telemetry.find({ droneId: req.params.droneId }).sort({ timestamp: -1 });

    if (!telemetry) {
      return res.status(404).json({ success: false, error: 'Telemetry not found for this drone' });
    }

    res.status(200).json({ success: true, data: telemetry });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export default { createTelemetry, getTelemetry, getTelemetryByDroneId };
