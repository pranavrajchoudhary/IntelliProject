import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Home } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const TermsAndConditions = () => {
  const navigate = useNavigate();
  
  const handleBackNavigation = () => {
    // Check if user came from registration page
    if (document.referrer.includes('/register')) {
      navigate('/register');
    } else {
      // Default back navigation
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-2 border-black p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={handleBackNavigation}
              className="inline-flex items-center text-gray-600 hover:text-black transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </button>
            <Link 
              to="/login" 
              className="inline-flex items-center text-gray-600 hover:text-black transition-colors"
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Link>
          </div>
          <div className="flex items-center">
            <FileText className="w-8 h-8 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-black">Terms and Conditions</h1>
              <p className="text-gray-600 mt-1">IntelliProject Collaboration Platform</p>
            </div>
          </div>
        </motion.div>

        {/* Terms Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white border-2 border-black p-8"
        >
          <div className="prose max-w-none">
            <p className="text-sm text-gray-500 mb-6">
              <strong>Last Updated:</strong> August 30, 2025
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-black mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 mb-4">
                By creating an account and using IntelliProject, you agree to be bound by these Terms and Conditions. 
                If you do not agree to these terms, please do not use our service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-black mb-4">2. Service Description</h2>
              <p className="text-gray-700 mb-4">
                IntelliProject is a collaborative project management platform that enables teams to work together 
                on projects, share ideas, manage tasks, and communicate effectively. The platform includes features 
                such as project creation, task management, real-time messaging, document sharing, and AI-powered assistance.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-black mb-4">3. User Accounts and Responsibilities</h2>
              <div className="text-gray-700 space-y-3">
                <p>• You must provide accurate and complete information when creating your account</p>
                <p>• You are responsible for maintaining the security of your account credentials</p>
                <p>• You must not share your account with others or allow unauthorized access</p>
                <p>• You agree to notify us immediately of any unauthorized use of your account</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-black mb-4">4. Acceptable Use Policy</h2>
              <div className="text-gray-700 space-y-3">
                <p>You agree NOT to:</p>
                <p>• Use the platform for any illegal or unauthorized purpose</p>
                <p>• Upload or share content that is offensive, harmful, or violates others' rights</p>
                <p>• Attempt to gain unauthorized access to other users' accounts or data</p>
                <p>• Interfere with or disrupt the platform's functionality</p>
                <p>• Use automated tools to access the platform without permission</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-black mb-4">5. Data and Privacy</h2>
              <p className="text-gray-700 mb-4">
                We respect your privacy and are committed to protecting your personal information. 
                Your data will be handled in accordance with our Privacy Policy. By using our service, 
                you consent to the collection and use of information as described in our Privacy Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-black mb-4">6. Intellectual Property</h2>
              <p className="text-gray-700 mb-4">
                The IntelliProject platform, including its design, functionality, and content, is owned by us 
                and protected by intellectual property laws. You retain ownership of the content you create 
                and upload to the platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-black mb-4">7. Service Availability</h2>
              <p className="text-gray-700 mb-4">
                While we strive to maintain 99.9% uptime, we cannot guarantee that the service will be 
                available at all times. We reserve the right to modify, suspend, or discontinue the service 
                with reasonable notice.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-black mb-4">8. Limitation of Liability</h2>
              <p className="text-gray-700 mb-4">
                IntelliProject is provided "as is" without warranties of any kind. We shall not be liable 
                for any indirect, incidental, special, or consequential damages arising from your use of the platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-black mb-4">9. Termination</h2>
              <p className="text-gray-700 mb-4">
                We reserve the right to terminate or suspend accounts that violate these terms. 
                You may also terminate your account at any time through the settings page.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-black mb-4">10. Changes to Terms</h2>
              <p className="text-gray-700 mb-4">
                We may update these Terms and Conditions from time to time. Users will be notified of 
                significant changes via email or platform notifications. Continued use of the service 
                constitutes acceptance of the updated terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-black mb-4">11. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about these Terms and Conditions, please contact us at:
              </p>
              <div className="bg-gray-50 p-4 border border-gray-200 rounded">
                <p className="text-gray-700">
                  <strong>Email:</strong> support@intelliproject.com<br />
                  <strong>Address:</strong> IntelliProject Team<br />
                  <strong>Response Time:</strong> Within 24-48 hours
                </p>
              </div>
            </section>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleBackNavigation}
              className="flex-1 bg-black text-white py-3 px-6 text-center hover:bg-gray-800 transition-colors font-medium"
            >
              I Agree - Go Back
            </button>
            <Link
              to="/register"
              className="flex-1 border-2 border-black text-black py-3 px-6 text-center hover:bg-gray-50 transition-colors font-medium"
            >
              Register New Account
            </Link>
            <Link
              to="/login"
              className="flex-1 border-2 border-gray-300 text-gray-700 py-3 px-6 text-center hover:bg-gray-50 transition-colors font-medium"
            >
              Login
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
