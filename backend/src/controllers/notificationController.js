import * as notificationModel from '../models/notificationModel.js';

export const getUserNotifications = async (req, res, next) => {
  try {
    const notifications = await notificationModel.getNotificationsByUserId(req.user.id);
    res.status(200).json({ notifications });
  } catch (error) {
    next(error);
  }
};

export const markNotificationAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    await notificationModel.markAsRead(id, req.user.id);
    res.status(200).json({ message: 'Marked as read' });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    await notificationModel.markAllAsRead(req.user.id);
    res.status(200).json({ message: 'All marked as read' });
  } catch (error) {
    next(error);
  }
};
