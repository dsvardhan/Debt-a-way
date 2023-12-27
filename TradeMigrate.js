const mongoose = require('mongoose');
const DebtPosting = require('./models/DebtPosting'); // Update with the correct path

// MongoDB connection string
const mongoURI = 'mongodb+srv://vardhanperforms:W9XKxSVEq7OyobMl@cluster0.mtpwkpr.mongodb.net/?retryWrites=true&w=majority'; // Replace with your connection string

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected...'))
  .catch(err => console.error(err));

const updateDebts = async () => {
  try {
    // Fetch all debt postings
    const debts = await DebtPosting.find({});

    // Iterate over each debt and update
    const updatePromises = debts.map(debt => {
      // Set default values for the new fields
      debt.isAvailableForTrade = false;
      debt.isTradeActive = false;
      debt.tradePrice = null; // or 0, depending on your preference

      return debt.save();
    });

    // Wait for all updates to complete
    await Promise.all(updatePromises);

    console.log('All debts have been updated');
  } catch (error) {
    console.error('Error updating debts:', error);
  } finally {
    mongoose.disconnect();
  }
};

updateDebts();
