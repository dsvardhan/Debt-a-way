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
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, [token]);

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
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
