// Sidebar.js
import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = () => {
  return (
    <div className="sidebar">
      <Link to="/">Home</Link>
      <Link to="/debts-owed">Debts Owed</Link>
      <Link to="/debts-receivable">Debts Receivable</Link>
      <Link to="/wallet">Wallet</Link>
    </div>
  );
};

export default Sidebar;
