import express from 'express';
import controller from '../controllers/reportController.js';

const { createReport, getReports, getReportById, updateReport, deleteReport } = controller;

const router = express.Router();

router.route('/').post(createReport).get(getReports);
router.route('/:id').get(getReportById).put(updateReport).delete(deleteReport);

export default router;
