import express from 'express';
import { createProject, getProjects, getProjectById, updateProject, deleteProject } from '../controllers/projectController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All project routes require authentication
router.use(protect);

router.post('/', authorize('Admin', 'Manager'), createProject);
router.get('/', getProjects);
router.get('/:id', getProjectById);
router.put('/:id', authorize('Admin', 'Manager'), updateProject);
router.delete('/:id', authorize('Admin', 'Manager'), deleteProject);

export default router;
