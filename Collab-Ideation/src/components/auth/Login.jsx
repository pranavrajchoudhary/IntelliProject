import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, User, Lock, AlertCircle, X, Info, CheckCircle, Mail, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState(null);
  
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [passwordResetStep, setPasswordResetStep] = useState('email'); // 'email', 'otp', 'password'
  const [resetEmail, setResetEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check for messages passed from registration
    if (location.state?.message) {
      setStatusMessage({
        text: location.state.message,
        type: location.state.type || 'info'
      });
      // Clear the state to prevent showing message on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(''); // Clears previous errors
    
    try {
      await login(formData.email, formData.password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (error) {
      // Handles different error types
      if (error.response) {
        const { status, data } = error.response;
        
        switch (status) {
          case 401:
            setError('Invalid email or password. Please try again.');
            toast.error('Invalid credentials');
            break;
          case 404:
            setError('Account not found. Please check your email.');
            toast.error('Account not found');
            break;
          case 429:
            setError('Too many login attempts. Please try again later.');
            toast.error('Too many attempts');
            break;
          default:
            setError(data?.message || 'Login failed. Please try again.');
            toast.error('Login failed');
        }
      } else if (error.request) {
        setError('Unable to connect to server. Please check your connection.');
        toast.error('Connection failed');
      } else {
        setError('An unexpected error occurred. Please try again.');
        toast.error('Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error when user starts typing
    if (error) setError('');
  };

  // Forgot Password Functions
  const openForgotPasswordModal = () => {
    setShowForgotPassword(true);
    setPasswordResetStep('email');
    setResetEmail(formData.email || '');
  };

  const closeForgotPasswordModal = () => {
    setShowForgotPassword(false);
    setPasswordResetStep('email');
    setResetEmail('');
    setOtpCode('');
    setNewPassword('');
    setConfirmNewPassword('');
    setSaving(false);
  };

  const sendOTP = async (e) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      toast.error('Please enter your email');
      return;
    }

    setSaving(true);
    try {
      await authAPI.forgotPasswordSendOTP(resetEmail);
      setPasswordResetStep('otp');
      toast.success('OTP sent to your email!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setSaving(false);
    }
  };

  const verifyOTPAndResetPassword = async (e) => {
    e.preventDefault();
    
    if (!otpCode.trim()) {
      toast.error('Please enter the OTP');
      return;
    }
    
    if (passwordResetStep === 'otp') {
      // Just verify OTP and move to password step
      setPasswordResetStep('password');
      toast.success('OTP verified! Now set your new password.');
      return;
    }

    if (passwordResetStep === 'password') {
      if (newPassword !== confirmNewPassword) {
        toast.error('New passwords do not match');
        return;
      }

      if (newPassword.length < 6) {
        toast.error('Password must be at least 6 characters long');
        return;
      }

      setSaving(true);
      try {
        await authAPI.forgotPasswordResetPassword(resetEmail, otpCode, newPassword);
        toast.success('Password reset successfully!');
        closeForgotPasswordModal();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to reset password');
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white border-2 border-black p-8 shadow-lg">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <LogIn className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold text-black">Welcome Back</h1>
            <p className="text-gray-600 mt-2">Sign in to your account</p>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${
                statusMessage.type === 'info' 
                  ? 'bg-blue-50 border-blue-200' 
                  : 'bg-green-50 border-green-200'
              } border-2 rounded p-4 mb-6 flex items-start space-x-3`}
            >
              {statusMessage.type === 'info' ? (
                <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1">
                <p className={`text-sm ${
                  statusMessage.type === 'info' ? 'text-blue-700' : 'text-green-700'
                }`}>
                  {statusMessage.text}
                </p>
              </div>
              <button
                onClick={() => setStatusMessage(null)}
                className={`${
                  statusMessage.type === 'info' 
                    ? 'text-blue-400 hover:text-blue-600' 
                    : 'text-green-400 hover:text-green-600'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* Error Alert */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border-2 border-red-200 rounded p-4 mb-6 flex items-start space-x-3"
            >
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <button
                onClick={() => setError('')}
                className="text-red-400 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Email
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  required
                  className={`w-full pl-10 pr-4 py-3 border-2 ${
                    error ? 'border-red-300' : 'border-gray-300'
                  } focus:border-black focus:outline-none transition-colors`}
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  required
                  className={`w-full pl-10 pr-4 py-3 border-2 ${
                    error ? 'border-red-300' : 'border-gray-300'
                  } focus:border-black focus:outline-none transition-colors`}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={openForgotPasswordModal}
                  className="text-sm text-gray-600 hover:text-black transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-3 px-4 hover:bg-gray-800 transition-colors disabled:opacity-50 font-medium"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-black font-medium hover:underline"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black bg-opacity-30">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white border-2 border-black p-8 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-black">Reset Password</h2>
              <button onClick={closeForgotPasswordModal} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-6 h-6" />
              </button>
            </div>

            {passwordResetStep === 'email' && (
              <div>
                <p className="text-gray-600 mb-4">
                  Enter your email address and we'll send you an OTP to reset your password.
                </p>
                <form onSubmit={sendOTP} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 focus:border-black focus:outline-none transition-colors"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  <div className="flex space-x-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      disabled={saving}
                      className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                      <Mail className="w-5 h-5" />
                      <span>{saving ? 'Sending...' : 'Send OTP'}</span>
                    </motion.button>
                    <button
                      type="button"
                      onClick={closeForgotPasswordModal}
                      className="px-6 py-3 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {passwordResetStep === 'otp' && (
              <div>
                <p className="text-gray-600 mb-4">
                  Enter the 6-digit OTP sent to your email address.
                </p>
                <form onSubmit={verifyOTPAndResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Enter OTP
                    </label>
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 focus:border-black focus:outline-none transition-colors text-center text-lg font-mono"
                      placeholder="Enter 6-digit OTP"
                      maxLength="6"
                      required
                    />
                    <p className="text-sm text-gray-600 mt-2">
                      OTP sent to {resetEmail}. Check your email inbox.
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      disabled={saving}
                      className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                      <Shield className="w-5 h-5" />
                      <span>Verify OTP</span>
                    </motion.button>
                    <button
                      type="button"
                      onClick={closeForgotPasswordModal}
                      className="px-6 py-3 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {passwordResetStep === 'password' && (
              <div>
                <p className="text-gray-600 mb-4">
                  OTP verified! Now create your new password.
                </p>
                <form onSubmit={verifyOTPAndResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 focus:border-black focus:outline-none transition-colors"
                      placeholder="Enter new password"
                      required
                      minLength="6"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 focus:border-black focus:outline-none transition-colors"
                      placeholder="Confirm new password"
                      required
                      minLength="6"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      disabled={saving}
                      className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <Lock className="w-5 h-5" />
                      <span>{saving ? 'Updating...' : 'Reset Password'}</span>
                    </motion.button>
                    <button
                      type="button"
                      onClick={closeForgotPasswordModal}
                      className="px-6 py-3 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Login;
