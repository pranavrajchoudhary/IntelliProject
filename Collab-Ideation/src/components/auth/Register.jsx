import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, User, Mail, Lock, Shield, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'member'
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!acceptedTerms) {
      alert('Please accept the Terms and Conditions to continue.');
      return;
    }
    
    setLoading(true);
    try {
      const result = await register(formData.name, formData.email, formData.password, formData.role);
      
      if (result && result.status === 'pending') {
        // Show pending approval message and redirect to login
        navigate('/login', { 
          state: { 
            message: 'Registration submitted for approval. You will be notified once approved.',
            type: 'info'
          }
        });
      } else {
        // Normal flow for approved registrations (members)
        navigate('/');
      }
    } catch (error) {
      // Error is already handled by AuthContext
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
              <UserPlus className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold text-black">Create Account</h1>
            <p className="text-gray-600 mt-2">Join our collaboration platform</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 focus:border-black focus:outline-none transition-colors"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 focus:border-black focus:outline-none transition-colors"
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
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 focus:border-black focus:outline-none transition-colors"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Role
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  name="role"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 focus:border-black focus:outline-none transition-colors appearance-none bg-white"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="member">Team Member</option>
                  <option value="pm">Project Manager</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex items-center h-5">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="w-4 h-4 text-black bg-gray-100 border-gray-300 rounded focus:ring-black focus:ring-2"
                    required
                  />
                </div>
                <div className="text-sm">
                  <label htmlFor="terms" className="text-gray-700">
                    I agree to the{' '}
                    <button
                      type="button"
                      onClick={() => window.open('/terms.html', '_blank')}
                      className="text-black font-medium hover:underline cursor-pointer"
                    >
                      Terms and Conditions
                    </button>
                    {' '}and{' '}
                    <button
                      type="button"
                      onClick={() => window.open('/terms.html', '_blank')}
                      className="text-black font-medium hover:underline cursor-pointer"
                    >
                      Privacy Policy
                    </button>
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <FileText className="w-4 h-4" />
                <button
                  type="button"
                  onClick={() => window.open('/terms.html', '_blank')}
                  className="hover:text-black transition-colors flex items-center cursor-pointer"
                >
                  Read our Terms and Conditions
                  <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={loading || !acceptedTerms}
              className="w-full bg-black text-white py-3 px-4 hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-black font-medium hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
