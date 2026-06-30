import express from 'express';
import { createTask, getTasksByProject, getTaskById, updateTask, deleteTask, getTaskTimeline } from '../controllers/taskController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All routes protected

router.post('/', authorize('Admin', 'Manager', 'Employee'), createTask);
router.get('/project/:projectId', getTasksByProject);
router.get('/:id', getTaskById);
router.get('/:id/timeline', getTaskTimeline);
router.put('/:id', updateTask);
router.delete('/:id', authorize('Admin', 'Manager', 'Employee'), deleteTask);

export default router;
