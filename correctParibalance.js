const mongoose = require('mongoose');
const User = require('./models/User'); // Update the path as per your project structure

mongoose.connect('mongodb+srv://vardhanperforms:W9XKxSVEq7OyobMl@cluster0.mtpwkpr.mongodb.net/?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true });

const correctWalletBalance = async (userId, newBalance) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found');
      return;
    }

    user.walletBalance = newBalance; // Set to the correct balance
    await user.save();
    console.log('Wallet balance updated successfully');
  } catch (error) {
    console.error('Error updating wallet balance:', error);
  } finally {
    mongoose.disconnect();
  }
};

const userId = '658360eebb2f56924d3728fc'; // Replace with the actual user ID
const newBalance = 29211; // Replace with the correct balance
correctWalletBalance(userId, newBalance);
