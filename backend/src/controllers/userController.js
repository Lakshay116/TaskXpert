import * as userModel from '../models/userModel.js';
import bcrypt from 'bcrypt';

export const getUsers = async (req, res, next) => {
  try {
    const users = await userModel.getAllUsers(req.user.organization_id);
    res.status(200).json({ users });
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { roleName } = req.body;

    // Check if the requester is an admin
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: { message: 'Only Admins can update roles' } });
    }

    const role = await userModel.getRoleByName(roleName);
    if (!role) return res.status(400).json({ error: { message: 'Invalid role' } });

    const updatedUser = await userModel.updateUserRole(id, role.id);
    res.status(200).json({ message: 'User role updated', user: updatedUser });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: { message: 'Only Admins can create users' } });
    }

    const { name, email, password, role = 'Employee', department = 'Support' } = req.body;

    const existingUser = await userModel.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: { message: 'Email already in use' } });
    }

    const roleRecord = await userModel.getRoleByName(role);
    if (!roleRecord) {
      return res.status(400).json({ error: { message: 'Invalid role specified' } });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await userModel.createUser(name, email, hashedPassword, roleRecord.id, req.user.organization_id, department);

    res.status(201).json({
      message: 'User created successfully',
      user: newUser
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: { message: 'Only Admins can delete users' } });
    }

    const { id } = req.params;

    // Prevent deleting self
    if (String(id) === String(req.user.id)) {
      return res.status(400).json({ error: { message: 'You cannot delete yourself' } });
    }

    await userModel.deleteUser(id, req.user.organization_id);

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: { message: 'Only Admins can update users' } });
    }

    const { id } = req.params;
    const { name, email, department } = req.body;

    const updatedUser = await userModel.updateUserDetails(id, req.user.organization_id, { name, email, department });
    
    if (!updatedUser) {
      return res.status(404).json({ error: { message: 'User not found or not in your organization' } });
    }

    res.status(200).json({ message: 'User updated successfully', user: updatedUser });
  } catch (error) {
    if (error.code === '23505') { // unique violation for email
      return res.status(400).json({ error: { message: 'Email already in use' } });
    }
    next(error);
  }
};
