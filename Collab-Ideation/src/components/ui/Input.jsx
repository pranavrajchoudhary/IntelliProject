import React from 'react';

const Input = ({ id, type, placeholder, value, onChange, icon }) => {
  return (
    <div className="relative">
      {icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {icon}
        </div>
      )}
      <input
        id={id}
        name={id}
        type={type}
        required
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full p-4 rounded-lg bg-gray-700 text-white border-2 border-gray-700 focus:outline-none focus:border-white transition-colors duration-200 placeholder-gray-400 ${icon ? 'pl-10' : ''}`}
      />
    </div>
  );
};

export default Input;