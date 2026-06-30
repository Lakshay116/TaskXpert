import * as taskModel from '../models/taskModel.js';
import * as notificationModel from '../models/notificationModel.js';
import * as projectModel from '../models/projectModel.js';
import * as userModel from '../models/userModel.js';
import { getIo } from '../config/socket.js';
import pool from '../config/db.js';

export const createTask = async (req, res, next) => {
  try {
    const { title, description, project_id, assigned_to, priority, due_date } = req.body;
    const createdBy = req.user.id;

    if (!title || !project_id) {
      return res.status(400).json({ error: { message: 'Title and project_id are required' } });
    }

    const project = await projectModel.getProjectById(project_id, req.user.organization_id);
    if (!project) {
      return res.status(404).json({ error: { message: 'Project not found' } });
    }

    const task = await taskModel.createTask(title, description, project_id, createdBy, assigned_to, priority, due_date);
    
    // Log creation in timeline
    await pool.query(
      `INSERT INTO task_timeline (task_id, user_id, action, details) VALUES ($1, $2, $3, $4)`,
      [task.id, createdBy, 'created', 'Task created']
    );
    
    if (assigned_to && assigned_to !== createdBy) {
      // project is already fetched above
      const assigner = await userModel.getUserById(createdBy);
      await notificationModel.createNotification(
        assigned_to,
        'New Task Assigned',
        `You have been assigned to task: ${title} in project ${project.name} by ${assigner.name}`,
        `/projects/${project_id}`
      );
      const io = getIo();
      if (io) {
        io.to(`user_${assigned_to}`).emit('app_notification', { type: 'task_assigned' });
      }
      
      // Simulate Email Sending
      console.log(`[EMAIL MOCK] Sent to User ID ${assigned_to}: You have a new task assigned - ${title}`);
    }

    res.status(201).json({ message: 'Task created', task });
  } catch (error) {
    next(error);
  }
};

export const getTasksByProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    
    const project = await projectModel.getProjectById(projectId, req.user.organization_id);
    if (!project) {
      return res.status(404).json({ error: { message: 'Project not found' } });
    }

    const tasks = await taskModel.getTasksByProject(projectId);
    res.status(200).json({ tasks });
  } catch (error) {
    next(error);
  }
};

export const getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await taskModel.getTaskById(id, req.user.organization_id);
    
    if (!task) {
      return res.status(404).json({ error: { message: 'Task not found' } });
    }
    
    res.status(200).json({ task });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, assigned_to, status, priority, due_date } = req.body;

    const task = await taskModel.getTaskById(id, req.user.organization_id);
    if (!task) {
      return res.status(404).json({ error: { message: 'Task not found' } });
    }

    const updatedTask = await taskModel.updateTask(id, {
      title, description, assignedTo: assigned_to, status, priority, dueDate: due_date
    });

    // Log status changes
    if (status && status !== task.status) {
      await pool.query(
        `INSERT INTO task_timeline (task_id, user_id, action, details) VALUES ($1, $2, $3, $4)`,
        [id, req.user.id, 'status_changed', `Moved task to ${status}`]
      );
    }

    // Log reassignment
    if (assigned_to !== undefined && assigned_to !== task.assigned_to) {
      let assignText = 'Unassigned task';
      if (assigned_to) {
        const assignedUser = await userModel.getUserById(assigned_to);
        assignText = `Assigned task to ${assignedUser?.name || 'User'}`;
      }
      await pool.query(
        `INSERT INTO task_timeline (task_id, user_id, action, details) VALUES ($1, $2, $3, $4)`,
        [id, req.user.id, 'reassigned', assignText]
      );
    }

    if (assigned_to && assigned_to !== task.assigned_to && assigned_to !== req.user.id) {
      console.log(`[DEBUG] Firing notification for assignment. assigned_to: ${assigned_to}, prev: ${task.assigned_to}`);
      const project = await projectModel.getProjectById(task.project_id, req.user.organization_id);
      await notificationModel.createNotification(
        assigned_to,
        'Task Reassigned',
        `You have been assigned to task: ${updatedTask.title} in project ${project.name}`,
        `/projects/${project.id}`
      );
      const io = getIo();
      if (io) {
        io.to(`user_${assigned_to}`).emit('app_notification', { type: 'task_assigned' });
      }

      // Simulate Email Sending
      console.log(`[EMAIL MOCK] Sent to User ID ${assigned_to}: You have been reassigned to task - ${updatedTask.title}`);
    }

    res.status(200).json({ message: 'Task updated', task: updatedTask });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await taskModel.getTaskById(id, req.user.organization_id);
    if (!task) {
      return res.status(404).json({ error: { message: 'Task not found' } });
    }

    // Only Admin/Manager or the creator can delete
    if (task.created_by !== req.user.id && !['Admin', 'Manager'].includes(req.user.role)) {
      return res.status(403).json({ error: { message: 'Not authorized to delete this task' } });
    }

    await taskModel.deleteTask(id);
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getTaskTimeline = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await taskModel.getTaskById(id, req.user.organization_id);
    if (!task) {
      return res.status(404).json({ error: { message: 'Task not found' } });
    }

    const { rows } = await pool.query(
      `SELECT t.*, u.name as user_name, r.name as user_role 
       FROM task_timeline t 
       LEFT JOIN users u ON t.user_id = u.id 
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE t.task_id = $1 
       ORDER BY t.created_at DESC`,
      [id]
    );
    res.status(200).json({ timeline: rows });
  } catch (error) {
    next(error);
  }
};
