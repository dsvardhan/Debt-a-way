import React, { useState } from 'react';
import axios from 'axios';

const DebtPostingForm = ({ token, onClose, onNewPosting,refreshPostings }) => {
  const [amount, setAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  // Add other fields as necessary

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/debt-postings',
        { amount, interestRate /*, other fields*/ },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      onNewPosting(response.data);
      onClose();
      refreshPostings();
    } catch (error) {
      console.error('Error creating debt posting:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" />
      <input type="number" value={interestRate} onChange={e => setInterestRate(e.target.value)} placeholder="Interest Rate" />
      {/* Other input fields */}
      <button type="submit">Submit</button>
    </form>
  );
};

export default DebtPostingForm;
