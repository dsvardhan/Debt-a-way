const mongoose = require('mongoose');
const User = require('./models/User');
const DebtPosting = require('./models/DebtPosting');

mongoose.connect('mongodb+srv://vardhanperforms:W9XKxSVEq7OyobMl@cluster0.mtpwkpr.mongodb.net/?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true });

const updateWalletBalances = async () => {
  try {
    // Find all paid debts
    const paidDebts = await DebtPosting.find({ isFulfilled: true, isPaid: true });
    // Find all unpaid but fulfilled debts
    const unpaidDebts = await DebtPosting.find({ isFulfilled: true, isPaid: false });

    // Update lenders' wallet balances
    for (const debt of paidDebts) {
      const lender = await User.findById(debt.lender);
      lender.walletBalance += debt.amount;
      await lender.save();
    }

    // Update borrowers' wallet balances
    for (const debt of unpaidDebts) {
      const borrower = await User.findById(debt.borrower);
      borrower.walletBalance -= debt.amount;
      await borrower.save();
    }

    console.log('Wallet balances updated successfully');
  } catch (error) {
    console.error('Error updating wallet balances:', error);
  } finally {
    mongoose.disconnect();
  }
};

updateWalletBalances();
