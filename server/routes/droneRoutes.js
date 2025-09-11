import express from 'express';
import controller from '../controllers/droneController.js';

const { createDrone, getDrones, getDroneById, updateDrone, deleteDrone } = controller;

const router = express.Router();

router.route('/').post(createDrone).get(getDrones);
router.route('/:id').get(getDroneById).put(updateDrone).delete(deleteDrone);

export default router;