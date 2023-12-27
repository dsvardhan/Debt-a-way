const mongoose = require('mongoose');
const DebtPosting = require('./models/DebtPosting'); // Adjust the path as necessary

mongoose.connect('mongodb+srv://vardhanperforms:W9XKxSVEq7OyobMl@cluster0.mtpwkpr.mongodb.net/?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true });

async function revertModelChanges() {
    // Fetch all debt postings
    const debts = await DebtPosting.find({});

    //ebt.isAvailableForTrade = false;
    //debt.isTradeActive = false;
    //debt.tradePrice = null;

    for (const debt of debts) {
        // Check for and revert changes. This is hypothetical and depends on your specific changes.
        if (debt.isAvailableForTrade) {
            delete debt.isAvailableForTrade; // Remove a field that was added
        }

        if (debt.isTradeActive) {
            delete debt.isTradeActive; // Remove a field that was added
        }

        if (debt.tradePrice) {
            delete debt.tradePrice; // Remove a field that was added
        }

        // If there were fields removed in the new model, you might have to set default values or restore them from backups.

        await debt.save();
    }

    console.log('Migration completed successfully.');
}

revertModelChanges().then(() => {
    mongoose.disconnect();
}).catch((error) => {
    console.error('Migration failed:', error);
    mongoose.disconnect();
});
