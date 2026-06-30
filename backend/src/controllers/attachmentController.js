import * as attachmentModel from '../models/attachmentModel.js';

export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'File is required' } });
    }
    const fileUrl = req.file.path; // Cloudinary URL
    res.status(200).json({ url: fileUrl });
  } catch (error) {
    next(error);
  }
};

export const uploadAttachment = async (req, res, next) => {
  try {
    const { task_id } = req.body;
    const uploadedBy = req.user.id;

    if (!task_id) {
      return res.status(400).json({ error: { message: 'task_id is required' } });
    }

    if (!req.file) {
      return res.status(400).json({ error: { message: 'File is required' } });
    }

    const fileUrl = req.file.path; // Cloudinary URL
    const fileType = req.file.mimetype;

    const attachment = await attachmentModel.createAttachment(task_id, uploadedBy, fileUrl, fileType);
    res.status(201).json({ message: 'File uploaded successfully', attachment });
  } catch (error) {
    next(error);
  }
};

export const getAttachments = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const attachments = await attachmentModel.getAttachmentsByTask(taskId);
    res.status(200).json({ attachments });
  } catch (error) {
    next(error);
  }
};

export const deleteAttachment = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const deleted = await attachmentModel.deleteAttachment(id);
    if (!deleted) {
      return res.status(404).json({ error: { message: 'Attachment not found' } });
    }

    res.status(200).json({ message: 'Attachment deleted from database' });
  } catch (error) {
    next(error);
  }
};
