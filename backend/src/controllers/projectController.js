import * as projectModel from '../models/projectModel.js';

export const createProject = async (req, res, next) => {
  try {
    const { name, description, department, project_type } = req.body;
    const ownerId = req.user.id; // From authMiddleware
    
    if (!name) {
      return res.status(400).json({ error: { message: 'Project name is required' } });
    }

    const project = await projectModel.createProject(name, description, ownerId, department, project_type, req.user.organization_id);
    res.status(201).json({ message: 'Project created', project });
  } catch (error) {
    next(error);
  }
};

export const getProjects = async (req, res, next) => {
  try {
    const projects = await projectModel.getAllProjects(req.user.id, req.user.role, req.user.organization_id);
    res.status(200).json({ projects });
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await projectModel.getProjectById(id, req.user.organization_id);
    
    if (!project) {
      return res.status(404).json({ error: { message: 'Project not found' } });
    }
    
    res.status(200).json({ project });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, department, project_type } = req.body;

    const project = await projectModel.getProjectById(id, req.user.organization_id);
    if (!project) {
      return res.status(404).json({ error: { message: 'Project not found' } });
    }

    // Only allow owner or admin to update
    if (project.owner_id !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({ error: { message: 'Not authorized to update this project' } });
    }

    const updatedProject = await projectModel.updateProject(id, name, description, department, project_type, req.user.organization_id);
    res.status(200).json({ message: 'Project updated', project: updatedProject });
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await projectModel.getProjectById(id, req.user.organization_id);
    if (!project) {
      return res.status(404).json({ error: { message: 'Project not found' } });
    }

    // Only allow owner or admin to delete
    if (project.owner_id !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({ error: { message: 'Not authorized to delete this project' } });
    }

    await projectModel.deleteProject(id, req.user.organization_id);
    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    next(error);
  }
};
