import React, { useState } from 'react';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  return (
    <div className="min-h-screen">
      {isLoggedIn ? (
        <Dashboard onLogout={handleLogout} />
      ) : (
        <Auth setIsLoggedIn={setIsLoggedIn} />
      )}
    </div>
  );
};

export default App;