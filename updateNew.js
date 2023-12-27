const mongoose = require('mongoose');
const DebtPosting = require('./models/DebtPosting'); // Adjust the path to your DebtPosting model

mongoose.connect('mongodb+srv://vardhanperforms:W9XKxSVEq7OyobMl@cluster0.mtpwkpr.mongodb.net/?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB...'))
  .catch(err => console.error('Could not connect to MongoDB...', err));

async function updateDebtPostings() {
  const result = await DebtPosting.updateMany(
    {}, 
    { 
      $set: { 
        isTradable: false, // Default value for isTradable
        tradePrice: 0 // Default value for tradePrice
      } 
    }
  );

  console.log(result);
}

updateDebtPostings()
  .then(() => mongoose.disconnect())
  .catch(err => console.error(err));
