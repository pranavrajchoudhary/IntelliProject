const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const ActivityLog = require('../models/ActivityLog');

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  // Check if user exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: 'User already exists' });
  }

  // Determine approval status based on role
  let status = 'approved'; // Default for backward compatibility
  let requiresApproval = false;

  if (role === 'admin' || role === 'pm') {
    status = 'pending';
    requiresApproval = true;
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role: role || 'member',
    status,
    originalRole: role || 'member'
  });

  if (user) {
    try {
      await ActivityLog.create({
        userId: user._id,
        action: 'User Registration',
        details: `New ${role || 'member'} account created${requiresApproval ? ' (pending approval)' : ''}`,
        timestamp: new Date()
      });
    } catch (error) {
      console.log('ActivityLog creation failed:', error.message);
    }

    if (requiresApproval) {
      res.status(201).json({
        message: 'Registration successful! Your account is pending approval. You will be notified once an administrator approves your request.',
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status
        }
      });
    } else {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        token: generateToken(user._id)
      });
    }
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
});

const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check for user
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    // Handle existing users without status field (backward compatibility)
    if (!user.status) {
      user.status = 'approved';
      await user.save();
    }

    // Check account status
    if (user.status === 'pending') {
      return res.status(403).json({
        message: 'Your account is pending approval. Please wait for an administrator to approve your registration.'
      });
    }

    if (user.status === 'rejected') {
      return res.status(403).json({
        message: `Your account registration was rejected. ${user.rejectionReason || 'Please contact an administrator for more information.'}`
      });
    }

    if (user.suspended || user.status === 'suspended') {
      return res.status(403).json({
        message: 'Your account has been suspended. Please contact an administrator.'
      });
    }

    try {
      await ActivityLog.create({
        userId: user._id,
        action: 'User Login',
        details: `User logged in successfully`,
        timestamp: new Date()
      });
    } catch (error) {
      console.log('ActivityLog creation failed:', error.message);
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      suspended: user.suspended || false,
      token: generateToken(user._id)
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
});

const getMe = asyncHandler(async (req, res) => {
  if (!req.user.status) {
    req.user.status = 'approved';
    await req.user.save();
  }

  res.json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    status: req.user.status,
    suspended: req.user.suspended || false,
    profilePicture: req.user.profilePicture,
    bio: req.user.bio,
    phoneNumber: req.user.phoneNumber,
    department: req.user.department,
    location: req.user.location,
    joinedAt: req.user.createdAt
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    if (!user.status) {
      user.status = 'approved';
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;
    user.phoneNumber = req.body.phoneNumber !== undefined ? req.body.phoneNumber : user.phoneNumber;
    user.department = req.body.department !== undefined ? req.body.department : user.department;
    user.location = req.body.location !== undefined ? req.body.location : user.location;
    user.profilePicture = req.body.profilePicture !== undefined ? req.body.profilePicture : user.profilePicture;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    try {
      await ActivityLog.create({
        userId: user._id,
        action: 'Profile Update',
        details: 'User updated their profile information',
        timestamp: new Date()
      });
    } catch (error) {
      console.log('ActivityLog creation failed:', error.message);
    }

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      status: updatedUser.status,
      suspended: updatedUser.suspended || false,
      profilePicture: updatedUser.profilePicture,
      bio: updatedUser.bio,
      phoneNumber: updatedUser.phoneNumber,
      department: updatedUser.department,
      location: updatedUser.location,
      token: generateToken(updatedUser._id)
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id);

  if (user && (await user.matchPassword(currentPassword))) {
    if (!user.status) {
      user.status = 'approved';
    }

    user.password = newPassword;
    await user.save();

    try {
      await ActivityLog.create({
        userId: user._id,
        action: 'Password Change',
        details: 'User changed their password',
        timestamp: new Date()
      });
    } catch (error) {
      console.log('ActivityLog creation failed:', error.message);
    }

    res.json({ message: 'Password changed successfully' });
  } else {
    res.status(400).json({ message: 'Current password is incorrect' });
  }
});

module.exports = {
  registerUser,
  authUser,
  getMe,
  updateProfile,
  changePassword
};
