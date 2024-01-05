// App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import Dashboard from './Dashboard';
import DebtsOwedPage from './DebtsOwedPage';
import DebtsReceivablePage from './DebtsReceivablePage';
import WalletPage from './WalletPage';
import Sidebar from './Sidebar';

const App = () => {
  // Your state and logic here

  return (
    <Router>
      <div>
        {!token ? (
          // Your login and registration logic
        ) : (
          <>
            <Sidebar />
            <Route exact path="/" component={() => <Dashboard token={token} onLogout={handleLogout} user={user} />} />
            <Route path="/debts-owed" component={DebtsOwedPage} />
            <Route path="/debts-receivable" component={DebtsReceivablePage} />
            <Route path="/wallet" component={WalletPage} />
          </>
        )}
      </div>
    </Router>
  );
};

export default App;
