import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const BackendLoader = ({ onBackendReady }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [dots, setDots] = useState('');

  useEffect(() => {
    // Animate dots
    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    // Check backend health
    const checkBackend = async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/health`, {
      method: 'GET',
    });
    
    if (response.ok) {
      setIsChecking(false);
      setTimeout(() => onBackendReady(), 1000);
    }
  } catch (error) {
    console.log('Backend still waking up...', error.message);
  }
};


    // Check every 2 seconds
    const healthCheckInterval = setInterval(checkBackend, 2000);
    checkBackend(); // Initial check

    return () => {
      clearInterval(dotsInterval);
      clearInterval(healthCheckInterval);
    };
  }, [onBackendReady]);

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      <div className="text-center">
        {/* Spinner */}
        <motion.div
          className="w-16 h-16 border-4 border-white border-t-transparent rounded-full mx-auto mb-8"
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        {/* Main Message */}
        <motion.h2
          className="text-2xl font-bold text-white mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Waiting for backend to wake up{dots}
        </motion.h2>
        
        {/* Subtitle */}
        <motion.p
          className="text-gray-400 text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          (Render Free Tier)
        </motion.p>
        
        {/* Estimated time */}
        <motion.p
          className="text-gray-500 text-sm mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          This usually takes 10-30 seconds
        </motion.p>
      </div>
    </div>
  );
};

export default BackendLoader;
