import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactModal from 'react-modal';
import DebtPostingForm from '../DebtPostingForm';
import { jwtDecode } from 'jwt-decode';



const Dashboard = ({ token,onLogout,user,updateUser }) => {
  const [unfulfilledDebts, setUnfulfilledDebts] = useState([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [debtsOwedByUser, setDebtsOwedByUser] = useState([]); // Added state
  const [debtsOwedToUser, setDebtsOwedToUser] = useState([]);
  const[debtsHistory,setDebtsHistory]=useState([]);
  const [walletBalance, setWalletBalance] = useState();
  //const [walletBalance2, setWalletBalance2] = useState([]);

  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [selectedDebtForTrade, setSelectedDebtForTrade] = useState(null);
  const [tradePrice, setTradePrice] = useState('');
  const [tradableDebts, setTradableDebts] = useState([]);
 
  const decodedToken = jwtDecode(token);
  const userId = decodedToken._id;

  const updateLocalUserAndBalance = (newBalance) => {
    const updatedUser = { ...user, walletBalance: newBalance };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    updateUser(updatedUser);
    setWalletBalance(newBalance);
  };
  
  const fetchUnfulfilledDebts = async () => {
    try {
      const response = await axios.get('https://localhost:5001/api/debt-postings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setUnfulfilledDebts(response.data);
    } catch (error) {
      console.error('Error fetching unfulfilled debts:', error);
    }
  };

  const fetchDebtsSummary = async () => {
    try {
        const debtsOwedResponse = await axios.get(`https://localhost:5001/api/debt-postings/debts-owed-by/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        setDebtsOwedByUser(debtsOwedResponse.data);
        //setDebtsOwedByUserHistory(debtsOwedResponse.data.paidDebts);
  
        const debtsToReceiveResponse = await axios.get(`https://localhost:5001/api/debt-postings/debts-owed-to/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        setDebtsOwedToUser(debtsToReceiveResponse.data);
        //setDebtsOwedToUserHistory(debtsOwedResponse.data.paidDebts);

        const debtsHistoryResponse = await axios.get(`https://localhost:5001/api/debt-postings/debts-history/${userId}`, { headers: { 'Authorization': `Bearer ${token}` } });
        setDebtsHistory(debtsHistoryResponse.data);

    } catch (error) {
        console.error('Error fetching debt summaries:', error);
    }
  };
  

  useEffect(() => {
    // console.log("useEffect running with userId:", userId); // Confirm useEffect execution
    // fetchUnfulfilledDebts();
    // fetchDebtsSummary();
    // fetchTradableDebts();
    
    // if (user) {
    //   setWalletBalance(user.walletBalance);
    //   // Initialize other user-related states if needed
    // }

     // Fetch user data from local storage
     const userData = localStorage.getItem('user');
     const user = userData ? JSON.parse(userData) : null;
 
     fetchUnfulfilledDebts();
     fetchDebtsSummary();
     fetchTradableDebts();
 
     if (user) {
       setWalletBalance(user.walletBalance);
     }
  }, [token,userId]);

  
  const openModal = () => setModalIsOpen(true);
  const closeModal = () => setModalIsOpen(false);

  const handleNewPosting = (newPosting) => {
    setUnfulfilledDebts([...unfulfilledDebts, newPosting]);
  };

//Lend working
  const handleLendClick = async (debtId) => {
    try {
      const response = await axios.patch(`https://localhost:5001/api/debt-postings/lend/${debtId}`, 
        {}, 
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      fetchUnfulfilledDebts();
      fetchDebtsSummary();
  
      // Update local state to reflect new wallet balance
      const updatedUser = response.data.user;
      setWalletBalance(updatedUser.walletBalance);
      updateLocalUserAndBalance(updatedUser.walletBalance);

      // Refresh data as needed
      //fetchUnfulfilledDebts();
      //fetchDebtsSummary();
    } catch (error) {
      console.error('Error lending to debt posting:', error);
    }
  };
  
  const handleLogout = () => {
    // Clear the authentication data (e.g., remove the token from local storage)
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Call the onLogout prop if it exists to handle any additional cleanup
    if (onLogout) {
      onLogout();
    }

    // Redirect the user to the login page or home page
    window.location.href = '/login'; // Adjust the URL to your login route
  };

  //Add to wallet working
  const handleAddToWallet = async (amount) => {
    try {
      const response = await axios.patch(`https://localhost:5001/api/users/update-wallet/${userId}`, 
        { amount },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setWalletBalance(response.data.walletBalance);
      updateLocalUserAndBalance(response.data.walletBalance);
      // setWalletBalance(response.data.walletBalance);
    } catch (error) {
      console.error('Error updating wallet balance:', error);
    }
  };
  
  const fetchWalletBalance = async () => {
    try {
      const response = await axios.get(`https://localhost:5001/api/wallet-balance/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log("Fetched wallet balance:", response.data.walletBalance); // Confirm response
      setWalletBalance(response.data.walletBalance);
      console.log("Wallet balance set to:", response.data.walletBalance); // Confirm state update
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  //Pay working
  const handlePayDebt = async (debtId) => {
    try {
      // Make an API call to mark the debt as paid or initiate the payment process
      const response = await axios.patch(`https://localhost:5001/api/debt-postings/pay/${debtId}`, 
        {}, // Any required data
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
  
      const updatedDebtInfo = response.data.debtPosting;
      const updatedUser = response.data.user;
      // updateLocalUserAndBalance(updatedUser.walletBalance);
      //updateLocalUserAndBalance(response.data.walletBalance);
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

      updateLocalUserAndBalance(updatedUser.walletBalance);
    } catch (error) {
      console.error('Error paying debt:', error);
    }
  };
  

  const handleOpenTradeModal = (debtId) => {
    setSelectedDebtForTrade(debtId);
    setIsTradeModalOpen(true);
  };

  const handleCloseTradeModal = () => {
    setIsTradeModalOpen(false);
    setSelectedDebtForTrade(null);
    setTradePrice('');
  };

  const handleTradeDebt = async () => {
    try {
      await axios.patch(`https://localhost:5001/api/debt-postings/trade-debt/${selectedDebtForTrade}`, 
        { tradePrice }, 
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      handleCloseTradeModal();
      fetchDebtsSummary(); // Refresh the debts list
      fetchTradableDebts();
      //updateLocalUserAndBalance(response.data.walletBalance);
    } catch (error) {
      console.error('Error trading debt:', error);
    }
  };

  const fetchTradableDebts = async () => {
    try {
      const response = await axios.get('https://localhost:5001/api/debt-postings/tradable-debts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setTradableDebts(response.data); // Make sure this line correctly sets the state
    } catch (error) {
      console.error('Error fetching tradable debts:', error);
    }
  };

  //Buy Working
  const handleBuyDebt = async (debtId, tradePrice) => {
    try {
      const response = await axios.patch(
        `https:localhost:5001/api/debt-postings/buy-debt/${debtId}`,
        {},  // Additional data can be sent if needed
        { headers: { 'Authorization': `Bearer ${token}` } }
      );


      setTradableDebts(prevDebts => prevDebts.filter(debt => debt._id !== debtId));
      // if (response.data.user) {
      //   setWalletBalance(response.data.user.walletBalance);
      //   updateLocalUserAndBalance(response.data.user.walletBalance);
      // }

      setWalletBalance(response.data.buyer.walletBalance);
      // Refresh other relevant data if necessary
      fetchTradableDebts();
      fetchDebtsSummary();

      if (response.data.buyer) {
        // setWalletBalance(response.data.buyer.walletBalance);
        updateLocalUserAndBalance(response.data.buyer.walletBalance);
      }

      // Update local state to reflect changes
      // This could involve removing the bought debt from `tradableDebts`
      // and updating the `walletBalance` if the user's balance is affected
      // setTradableDebts(prevDebts => prevDebts.filter(debt => debt._id !== debtId));
      // // if (response.data.user) {
      // //   setWalletBalance(response.data.user.walletBalance);
      // //   updateLocalUserAndBalance(response.data.user.walletBalance);
      // // }

      // // Refresh other relevant data if necessary
      // fetchTradableDebts();
      // fetchDebtsSummary();
    } catch (error) {
      console.error('Error buying debt:', error);
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

      <ReactModal isOpen={isTradeModalOpen} onRequestClose={handleCloseTradeModal}>
        <h4>Set Trade Price</h4>
        <input
          type="number"
          value={tradePrice}
          onChange={(e) => setTradePrice(e.target.value)}
          placeholder="Trade Price"
        />
        <button onClick={handleTradeDebt}>Confirm Trade</button>
        <button onClick={handleCloseTradeModal}>Cancel</button>
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
                            <td>
                              <button onClick={() => handleOpenTradeModal(debt._id)}>Trade Debt</button>
                            </td>
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

<h3>Tradable Debt Postings</h3>
      <table>
        <thead>
          <tr>
            <th>Borrower</th>
            <th>Amount</th>
            <th>Interest Rate</th>
            <th>Trade Price</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {tradableDebts.map(debt => (
            <tr key={debt._id}>
              <td>{debt.borrower.username}</td>
              <td>{debt.amount}</td>
              <td>{debt.interestRate}%</td>
              <td>{debt.tradePrice}</td>
              <td>
                <button onClick={() => handleBuyDebt(debt._id)}>Buy</button>
              </td>
            </tr>
          ))}
         </tbody>
      </table>

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
