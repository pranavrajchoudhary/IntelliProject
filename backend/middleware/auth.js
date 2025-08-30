const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      if (!user.status) {
        user.status = 'approved';
        await user.save();
      }

      if (user.suspended || user.status === 'suspended') {
        return res.status(403).json({ 
          message: 'Your account has been suspended. Please contact an administrator.' 
        });
      }

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

      req.user = user;
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  return res.status(401).json({ message: 'Not authorized, no token' });
};

module.exports = { protect };
