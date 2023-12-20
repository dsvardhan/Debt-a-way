import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Dashboard = ({ token }) => {
  const [debts, setDebts] = useState([]);

  useEffect(() => {
    const fetchDebts = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/debt-postings', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setDebts(response.data);
      } catch (error) {
        console.error('Error fetching debts:', error);
      }
    };

    fetchDebts();
  }, [token]);

  return (
    <div>
      <h2>Debt Postings</h2>
      {debts.map(debt => (
        <div key={debt._id}>
          <p>Amount: {debt.amount}</p>
          <p>Interest Rate: {debt.interestRate}%</p>
          {/* Add more details here */}
        </div>
      ))}
    </div>
  );
};

export default Dashboard;
