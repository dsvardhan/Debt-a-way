import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';
import Dashboard from './Dashboard';

const App = () => {
  const [token, setToken] = useState(null);
  const [showLogin, setShowLogin] = useState(true);

  return (
    <div>
      {!token ? (
        showLogin ? (
          <Login onLogin={setToken} onShowRegister={() => setShowLogin(false)} />
        ) : (
          <Register onRegister={setToken} onShowLogin={() => setShowLogin(true)} />
        )
      ) : (
        <Dashboard token={token} />
      )}
    </div>
  );
};

export default App;
