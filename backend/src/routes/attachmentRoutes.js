import express from 'express';
import { uploadAttachment, getAttachments, deleteAttachment, uploadImage } from '../controllers/attachmentController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

router.use(protect);

// Apply multer middleware for single file upload named 'file'
router.post('/upload', upload.single('file'), uploadImage);
router.post('/', upload.single('file'), uploadAttachment);
router.get('/task/:taskId', getAttachments);
router.delete('/:id', deleteAttachment);

export default router;
