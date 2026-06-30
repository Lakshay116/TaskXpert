import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { createUser, getUserByEmail, getRoleByName, updateGoogleIdAndAvatar } from '../models/userModel.js';
import { createOrganization } from '../models/organizationModel.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateTokens = (user) => {
  const payload = { id: user.id, role: user.role_name, organization_id: user.organization_id, department: user.department };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password, organization_name, department = 'Technical' } = req.body;

    if (!organization_name) {
      return res.status(400).json({ error: { message: 'Organization name is required' } });
    }

    // Check if user exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: { message: 'Email already in use' } });
    }

    // Creator is always Admin
    const roleRecord = await getRoleByName('Admin');

    // Create Organization
    const org = await createOrganization(organization_name);

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await createUser(name, email, hashedPassword, roleRecord.id, org.id, department);

    res.status(201).json({
      message: 'User registered successfully',
      user: newUser
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: { message: 'Invalid email or password' } });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: { message: 'Invalid email or password' } });
    }

    // Check status
    if (user.status !== 'active') {
      return res.status(403).json({ error: { message: 'Account is inactive' } });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Return user without password
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role_id: user.role_id,
      role_name: user.role_name,
      organization_id: user.organization_id,
      organization_name: user.organization_name,
      department: user.department,
      avatar: user.avatar,
      status: user.status
    };

    res.status(200).json({
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: userResponse
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(401).json({ error: { message: 'Refresh token is required' } });
    }

    jwt.verify(token, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: { message: 'Invalid refresh token' } });
      }

      const newAccessToken = jwt.sign(
        { id: decoded.id, role: decoded.role, organization_id: decoded.organization_id, department: decoded.department },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      res.status(200).json({ accessToken: newAccessToken });
    });
  } catch (error) {
    next(error);
  }
};

export const googleLogin = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: { message: 'Google ID token is required' } });
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const { name, email, sub: googleId, picture } = ticket.getPayload();
    
    let user = await getUserByEmail(email);
    
    if (!user) {
      // Create user if they don't exist
      const roleRecord = await getRoleByName('Employee');
      
      // We don't have an org for them yet if they use Google login for the first time.
      // In a real multi-tenant SaaS, Google Login either joins via invite link or creates a new org.
      // We will assign to default org (id 1) for now to prevent breaking, or require them to register normally first.
      await createUser(name, email, null, roleRecord.id, 1, 'Technical', googleId);
      user = await getUserByEmail(email); // Fetch full user with role_name
      await updateGoogleIdAndAvatar(user.id, googleId, picture);
      user.avatar = picture;
      user.google_id = googleId;
    } else if (!user.google_id || !user.avatar) {
      // Link existing account
      await updateGoogleIdAndAvatar(user.id, googleId, picture);
      user.google_id = googleId;
      user.avatar = user.avatar || picture;
    }
    
    // Check status
    if (user.status !== 'active') {
      return res.status(403).json({ error: { message: 'Account is inactive' } });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role_id: user.role_id,
      role_name: user.role_name,
      organization_id: user.organization_id,
      organization_name: user.organization_name,
      department: user.department,
      avatar: user.avatar,
      status: user.status
    };

    res.status(200).json({
      message: 'Google Login successful',
      accessToken,
      refreshToken,
      user: userResponse
    });
  } catch (error) {
    next(error);
  }
};
