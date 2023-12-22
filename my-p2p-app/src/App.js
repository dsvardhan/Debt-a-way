import React, { useState, useEffect } from 'react';
import Login from './Login';
import Register from './Register';
import Dashboard from './Dashboard';

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [showLogin, setShowLogin] = useState(!token);

  useEffect(() => {
    // Update showLogin based on token presence
    setShowLogin(!token);
  }, [token]);

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('token');
    // Additional cleanup if needed
  };

  return (
    <div>
      {!token ? (
        showLogin ? (
          <Login onLogin={setToken} onShowRegister={() => setShowLogin(false)} />
        ) : (
          <Register onRegister={setToken} onShowLogin={() => setShowLogin(true)} />
        )
      ) : (
        <Dashboard token={token} onLogout={handleLogout} />
      )}
    </div>
  );
};

export default App;
