import Drone from '../models/Drone.js';

// @desc    Create a new drone
// @route   POST /api/drones
// @access  Private
const createDrone = async (req, res) => {
  try {
    const drone = await Drone.create(req.body);
    res.status(201).json({ success: true, data: drone });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Get all drones
// @route   GET /api/drones
// @access  Private
const getDrones = async (req, res) => {
  try {
    const drones = await Drone.find();
    res.status(200).json({ success: true, count: drones.length, data: drones });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get single drone
// @route   GET /api/drones/:id
// @access  Private
const getDroneById = async (req, res) => {
  try {
    const drone = await Drone.findById(req.params.id);

    if (!drone) {
      return res.status(404).json({ success: false, error: 'Drone not found' });
    }

    res.status(200).json({ success: true, data: drone });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update drone
// @route   PUT /api/drones/:id
// @access  Private
const updateDrone = async (req, res) => {
  try {
    const drone = await Drone.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!drone) {
      return res.status(404).json({ success: false, error: 'Drone not found' });
    }

    res.status(200).json({ success: true, data: drone });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Delete drone
// @route   DELETE /api/drones/:id
// @access  Private
const deleteDrone = async (req, res) => {
  try {
    const drone = await Drone.findByIdAndDelete(req.params.id);

    if (!drone) {
      return res.status(404).json({ success: false, error: 'Drone not found' });
    }

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export default { createDrone, getDrones, getDroneById, updateDrone, deleteDrone };
