import React, { useState, useEffect } from 'react';
import Login from './Login';
import Register from './Register';
import Dashboard from './Dashboard';

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null); // User state
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
          <Login onLogin={setToken} onShowRegister={() => setShowLogin(false)} setUser={setUser} />
        ) : (
          <Register onRegister={setToken} onShowLogin={() => setShowLogin(true)} setUser={setUser}/>
        )
      ) : (
        <Dashboard token={token} onLogout={handleLogout}  user={user} />
      )}
    </div>
  );
};

export default App;
