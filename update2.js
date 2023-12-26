const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb+srv://vardhanperforms:W9XKxSVEq7OyobMl@cluster0.mtpwkpr.mongodb.net/?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true });

const initializeWalletBalances = async () => {
  try {
    const users = await User.find();

    for (const user of users) {
      if (user.walletBalance === undefined) {
        user.walletBalance = 0;
        await user.save();
      }
    }

    console.log('All users have been updated with a wallet balance.');
  } catch (error) {
    console.error('Error initializing wallet balances:', error);
  } finally {
    mongoose.disconnect();
  }
};

initializeWalletBalances();
