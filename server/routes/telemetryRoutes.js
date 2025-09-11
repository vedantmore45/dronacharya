import express from 'express';
import controller from '../controllers/telemetryController.js';

export default (io) => {
  const router = express.Router();

  const { createTelemetry, getTelemetry, getTelemetryByDroneId } = controller;

  router.route('/').post(createTelemetry(io)).get(getTelemetry);
  router.route('/drone/:droneId').get(getTelemetryByDroneId);

  return router;
};
