import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactModal from 'react-modal';
import DebtPostingForm from './DebtPostingForm';
import { jwtDecode } from 'jwt-decode';



const Dashboard = ({ token,onLogout,user }) => {
  const [unfulfilledDebts, setUnfulfilledDebts] = useState([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [debtsOwedByUser, setDebtsOwedByUser] = useState([]); // Added state
  const [debtsOwedToUser, setDebtsOwedToUser] = useState([]);
  const[debtsHistory,setDebtsHistory]=useState([]);
  const [walletBalance, setWalletBalance] = useState();
  //const [walletBalance2, setWalletBalance2] = useState([]);

 
  const decodedToken = jwtDecode(token);
  const userId = decodedToken._id;

  
  
  const fetchUnfulfilledDebts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/debt-postings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setUnfulfilledDebts(response.data);
    } catch (error) {
      console.error('Error fetching unfulfilled debts:', error);
    }
  };

  const fetchDebtsSummary = async () => {
    try {
        const debtsOwedResponse = await axios.get(`http://localhost:5000/api/debt-postings/debts-owed-by/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        setDebtsOwedByUser(debtsOwedResponse.data);
        //setDebtsOwedByUserHistory(debtsOwedResponse.data.paidDebts);
  
        const debtsToReceiveResponse = await axios.get(`http://localhost:5000/api/debt-postings/debts-owed-to/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        setDebtsOwedToUser(debtsToReceiveResponse.data);
        //setDebtsOwedToUserHistory(debtsOwedResponse.data.paidDebts);

        const debtsHistoryResponse = await axios.get(`http://localhost:5000/api/debt-postings/debts-history/${userId}`, { headers: { 'Authorization': `Bearer ${token}` } });
        setDebtsHistory(debtsHistoryResponse.data);

    } catch (error) {
        console.error('Error fetching debt summaries:', error);
    }
  };
  

  useEffect(() => {
    console.log("useEffect running with userId:", userId); // Confirm useEffect execution
    fetchUnfulfilledDebts();
    fetchDebtsSummary();
    
    if (user) {
      setWalletBalance(user.walletBalance);
      // Initialize other user-related states if needed
    }
    
  }, [token,userId,user]);

  
  const openModal = () => setModalIsOpen(true);
  const closeModal = () => setModalIsOpen(false);

  const handleNewPosting = (newPosting) => {
    setUnfulfilledDebts([...unfulfilledDebts, newPosting]);
  };


  const handleLendClick = async (debtId) => {
    try {
      const response = await axios.patch(`http://localhost:5000/api/debt-postings/lend/${debtId}`, 
        {}, 
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
  
      // Update local state to reflect new wallet balance
      const updatedUser = response.data.user;
      setWalletBalance(updatedUser.walletBalance);
  
      // Refresh data as needed
      fetchUnfulfilledDebts();
      fetchDebtsSummary();
    } catch (error) {
      console.error('Error lending to debt posting:', error);
    }
  };
  
  const handleLogout = () => {
    // Clear the authentication data (e.g., remove the token from local storage)
    localStorage.removeItem('token');

    // Call the onLogout prop if it exists to handle any additional cleanup
    if (onLogout) {
      onLogout();
    }

    // Redirect the user to the login page or home page
    window.location.href = '/login'; // Adjust the URL to your login route
  };

  const handleAddToWallet = async (amount) => {
    try {
      const response = await axios.patch(`http://localhost:5000/api/users/update-wallet/${userId}`, 
        { amount },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setWalletBalance(response.data.walletBalance);
    } catch (error) {
      console.error('Error updating wallet balance:', error);
    }
  };
  
  const fetchWalletBalance = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/wallet-balance/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log("Fetched wallet balance:", response.data.walletBalance); // Confirm response
      setWalletBalance(response.data.walletBalance);
      console.log("Wallet balance set to:", response.data.walletBalance); // Confirm state update
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  const handlePayDebt = async (debtId) => {
    try {
      // Make an API call to mark the debt as paid or initiate the payment process
      const response = await axios.patch(`http://localhost:5000/api/debt-postings/pay/${debtId}`, 
        {}, // Any required data
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
  
      const updatedDebtInfo = response.data.debtPosting;
      const updatedUser = response.data.user;
  
      // Update debts owed by the user
      setDebtsOwedByUser(prev => prev.filter(debt => debt._id !== debtId));
  
      // Update debts owed to the user
      setDebtsOwedToUser(prev => prev.filter(debt => debt._id !== debtId));
  
      // Update the history with the paid debt
      setDebtsHistory(prevHistory => [...prevHistory, updatedDebtInfo]);
  
      // Update wallet balance
      setWalletBalance(updatedUser.walletBalance);
  
      // Refresh the list of debts owed by the user
      fetchDebtsSummary();
    } catch (error) {
      console.error('Error paying debt:', error);
    }
  };
  

   // Compute debtsPaidByMe and debtsPaidToMe just before the return statement
   const debtsPaidByMe = debtsHistory.filter(debt => debt.borrower._id === userId);
   const debtsPaidToMe = debtsHistory.filter(debt => debt.lender._id === userId);
  return (
    <div>
      <h2>Dashboard</h2>
      
      <button onClick={openModal}>Post Debt</button>
      <ReactModal isOpen={modalIsOpen} onRequestClose={closeModal}>
        <DebtPostingForm token={token} onClose={closeModal} onNewPosting={handleNewPosting} refreshPostings={fetchUnfulfilledDebts} />
      </ReactModal>
      <button onClick={handleLogout}>Logout</button>
      <h3>Wallet Balance: ${walletBalance}</h3>
      <button onClick={() => handleAddToWallet(prompt("Enter amount to add:"))}>Add to Wallet</button>
      <h3>Debts Owed by Me</h3>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Amount</th>
                        <th>Interest Rate</th>
                    </tr>
                </thead>
                <tbody>
                    {debtsOwedByUser.map(debt => (
                        <tr key={debt._id}>
                            <td>{debt.lender.username}</td> {/* Adjust as per your data structure */}
                            <td>{debt.amount}</td>
                            <td>{debt.interestRate}%</td>
                            <td>
                              <button onClick={() => handlePayDebt(debt._id)}>Pay</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <h3>Debts Owed to Me</h3>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Amount</th>
                        <th>Interest Rate</th>
                    </tr>
                </thead>
                <tbody>
                    {debtsOwedToUser.map(debt => (
                        <tr key={debt._id}>
                            <td>{debt.borrower.username}</td> {/* Adjust as per your data structure */}
                            <td>{debt.amount}</td>
                            <td>{debt.interestRate}%</td>
                        </tr>


                    ))}
                </tbody>
            </table>

            
      
      <h3>Unfulfilled Debt Postings</h3>
      {unfulfilledDebts.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Amount</th>
              <th>Interest Rate</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {unfulfilledDebts.map(debt => (
              <tr key={debt._id}>
                <td>{debt.borrower.username}</td>
                <td>{debt.amount}</td>
                <td>{debt.interestRate}%</td>
                <td>
                  <button onClick={() => handleLendClick(debt._id)}>Lend</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No unfulfilled debt postings available.</p>
      )}


<h3>Debt History</h3>
      
      <h4>Debts Paid by Me</h4>
      <table>
        <thead>
          <tr>
            <th>Lender Name</th>
            <th>Amount</th>
            <th>Interest Rate</th>
          </tr>
        </thead>
        <tbody>
          {debtsPaidByMe.map(debt => (
            <tr key={debt._id}>
              <td>{debt.lender.username}</td>
              <td>${debt.amount}</td>
              <td>{debt.interestRate}%</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h4>Debts Paid to Me</h4>
      <table>
        <thead>
          <tr>
            <th>Borrower Name</th>
            <th>Amount</th>
            <th>Interest Rate</th>
          </tr>
        </thead>
        <tbody>
          {debtsPaidToMe.map(debt => (
            <tr key={debt._id}>
              <td>{debt.borrower.username}</td>
              <td>${debt.amount}</td>
              <td>{debt.interestRate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    
  );
};

export default Dashboard;
