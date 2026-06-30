import * as commentModel from '../models/commentModel.js';

export const addComment = async (req, res, next) => {
  try {
    const { task_id, comment } = req.body;
    const userId = req.user.id;

    if (!task_id || !comment) {
      return res.status(400).json({ error: { message: 'task_id and comment are required' } });
    }

    const newComment = await commentModel.createComment(task_id, userId, comment);
    res.status(201).json({ message: 'Comment added', comment: newComment });
  } catch (error) {
    next(error);
  }
};

export const getComments = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const comments = await commentModel.getCommentsByTask(taskId);
    res.status(200).json({ comments });
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const comment = await commentModel.getCommentById(id);

    if (!comment) {
      return res.status(404).json({ error: { message: 'Comment not found' } });
    }

    // Only owner or admin/manager can delete
    if (comment.user_id !== req.user.id && !['Admin', 'Manager'].includes(req.user.role)) {
      return res.status(403).json({ error: { message: 'Not authorized to delete this comment' } });
    }

    await commentModel.deleteComment(id);
    res.status(200).json({ message: 'Comment deleted' });
  } catch (error) {
    next(error);
  }
};
