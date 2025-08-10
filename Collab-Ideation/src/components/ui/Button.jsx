import React from 'react';
import { motion } from 'framer-motion';

const Button = ({ children, onClick, type = 'button', disabled = false }) => {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center p-4 rounded-lg bg-white text-gray-900 font-bold shadow-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
    >
      {children}
    </motion.button>
  );
};

export default Button;