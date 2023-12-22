const mongoose = require('mongoose');
const DebtPosting = require('./models/DebtPosting'); // Adjust the path to your DebtPosting model

mongoose.connect('mongodb+srv://vardhanperforms:W9XKxSVEq7OyobMl@cluster0.mtpwkpr.mongodb.net/?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true });

async function updateDebtPostings() {
  try {
    // Update all existing documents to include 'isPaid' field
    const result = await DebtPosting.updateMany({}, { $set: { isPaid: false } });
    console.log('Debt postings updated:', result);

    // Close the database connection
    mongoose.disconnect();
  } catch (error) {
    console.error('Error updating debt postings:', error);
  }
}

updateDebtPostings();
