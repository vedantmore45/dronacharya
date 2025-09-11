import express from 'express';
import controller from '../controllers/missionController.js';

const { 
  createMission, getMissions, getMissionById, updateMission, deleteMission,
  pauseMission, resumeMission, abortMission, startMission, completeMission
} = controller;

const router = express.Router();

router.route('/').post(createMission).get(getMissions);
router.route('/:id').get(getMissionById).put(updateMission).delete(deleteMission);
router.put('/:id/pause', pauseMission);
router.put('/:id/resume', resumeMission);
router.put('/:id/abort', abortMission);
router.put('/:id/start', startMission);
router.put('/:id/complete', completeMission);

export default router;
