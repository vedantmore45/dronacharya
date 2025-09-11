import Mission from '../models/Mission.js';

// @desc    Create a new mission
// @route   POST /api/missions
// @access  Private
const createMission = async (req, res) => {
  try {
    const mission = await Mission.create(req.body);
    res.status(201).json({ success: true, data: mission });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Get all missions
// @route   GET /api/missions
// @access  Private
const getMissions = async (req, res) => {
  try {
    const missions = await Mission.find();
    res.status(200).json({ success: true, count: missions.length, data: missions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get single mission
// @route   GET /api/missions/:id
// @access  Private
const getMissionById = async (req, res) => {
  try {
    const mission = await Mission.findById(req.params.id);

    if (!mission) {
      return res.status(404).json({ success: false, error: 'Mission not found' });
    }

    res.status(200).json({ success: true, data: mission });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update mission
// @route   PUT /api/missions/:id
// @access  Private
const updateMission = async (req, res) => {
  try {
    const mission = await Mission.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!mission) {
      return res.status(404).json({ success: false, error: 'Mission not found' });
    }

    res.status(200).json({ success: true, data: mission });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Delete mission
// @route   DELETE /api/missions/:id
// @access  Private
const deleteMission = async (req, res) => {
  try {
    const mission = await Mission.findByIdAndDelete(req.params.id);

    if (!mission) {
      return res.status(404).json({ success: false, error: 'Mission not found' });
    }

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Pause a mission
// @route   PUT /api/missions/:id/pause
// @access  Private
const pauseMission = async (req, res) => {
  try {
    const mission = await Mission.findById(req.params.id);

    if (!mission) {
      return res.status(404).json({ success: false, error: 'Mission not found' });
    }

    mission.status = 'paused';
    await mission.save();

    res.status(200).json({ success: true, data: mission });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Resume a mission
// @route   PUT /api/missions/:id/resume
// @access  Private
const resumeMission = async (req, res) => {
  try {
    const mission = await Mission.findById(req.params.id);

    if (!mission) {
      return res.status(404).json({ success: false, error: 'Mission not found' });
    }

    mission.status = 'in_progress'; // Or previous status before pausing
    await mission.save();

    res.status(200).json({ success: true, data: mission });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Start a mission
// @route   PUT /api/missions/:id/start
// @access  Private
const startMission = async (req, res) => {
  try {
    const mission = await Mission.findById(req.params.id);

    if (!mission) {
      return res.status(404).json({ success: false, error: 'Mission not found' });
    }

    mission.status = 'in_progress';
    mission.startTime = new Date();
    await mission.save();

    res.status(200).json({ success: true, data: mission });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Abort a mission
// @route   PUT /api/missions/:id/abort
// @access  Private
const abortMission = async (req, res) => {
  try {
    const mission = await Mission.findById(req.params.id);

    if (!mission) {
      return res.status(404).json({ success: false, error: 'Mission not found' });
    }

    mission.status = 'aborted';
    await mission.save();

    res.status(200).json({ success: true, data: mission });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Complete a mission
// @route   PUT /api/missions/:id/complete
// @access  Private
const completeMission = async (req, res) => {
  try {
    const mission = await Mission.findById(req.params.id);

    if (!mission) {
      return res.status(404).json({ success: false, error: 'Mission not found' });
    }

    mission.status = 'completed';
    mission.endTime = new Date();
    await mission.save();

    res.status(200).json({ success: true, data: mission });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export default { 
  createMission, getMissions, getMissionById, updateMission, deleteMission,
  pauseMission, resumeMission, abortMission, startMission, completeMission
};
