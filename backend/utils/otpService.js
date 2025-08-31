const crypto = require('crypto');

const otpStore = new Map();

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const storeOTP = (email, otp) => {
  const expirationTime = Date.now() + 10 * 60 * 1000;
  otpStore.set(email, {
    otp,
    expiresAt: expirationTime,
    attempts: 0
  });
};

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
  
  otpStore.delete(email);
  return { valid: true, message: 'OTP verified successfully' };
};

const cleanExpiredOTPs = () => {
  const now = Date.now();
  for (const [email, otpData] of otpStore.entries()) {
    if (now > otpData.expiresAt) {
      otpStore.delete(email);
    }
  }
};

setInterval(cleanExpiredOTPs, 5 * 60 * 1000);

module.exports = {
  generateOTP,
  storeOTP,
  verifyOTP
};
