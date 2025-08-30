const crypto = require('crypto');

// Store OTPs temporarily (in production, use Redis)
const otpStore = new Map();

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Store OTP with expiration
const storeOTP = (email, otp) => {
  const expirationTime = Date.now() + 10 * 60 * 1000; // 10 minutes
  otpStore.set(email, {
    otp,
    expiresAt: expirationTime,
    attempts: 0
  });
};

// Verify OTP
const verifyOTP = (email, providedOTP) => {
  const otpData = otpStore.get(email);
  
  if (!otpData) {
    return { valid: false, message: 'OTP not found or expired' };
  }
  
  if (Date.now() > otpData.expiresAt) {
    otpStore.delete(email);
    return { valid: false, message: 'OTP has expired' };
  }
  
  if (otpData.attempts >= 3) {
    otpStore.delete(email);
    return { valid: false, message: 'Too many attempts. Please request a new OTP' };
  }
  
  if (otpData.otp !== providedOTP) {
    otpData.attempts++;
    return { valid: false, message: 'Invalid OTP' };
  }
  
  // OTP is valid
  otpStore.delete(email);
  return { valid: true, message: 'OTP verified successfully' };
};

// Clean expired OTPs (run periodically)
const cleanExpiredOTPs = () => {
  const now = Date.now();
  for (const [email, otpData] of otpStore.entries()) {
    if (now > otpData.expiresAt) {
      otpStore.delete(email);
    }
  }
};

// Clean expired OTPs every 5 minutes
setInterval(cleanExpiredOTPs, 5 * 60 * 1000);

module.exports = {
  generateOTP,
  storeOTP,
  verifyOTP
};
