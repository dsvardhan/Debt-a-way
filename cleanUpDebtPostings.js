const mongoose = require('mongoose');
const DebtPosting = require('./models/DebtPosting'); // Update the path as per your project structure
const dbURI = 'mongodb+srv://vardhanperforms:W9XKxSVEq7OyobMl@cluster0.mtpwkpr.mongodb.net/?retryWrites=true&w=majority'; // Your MongoDB URI

mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('MongoDB Connected');

    try {
      // Find all debt postings where borrower is the same as lender
      const postingsToRemove = await DebtPosting.find({ 
        $expr: { $eq: ['$borrower', '$lender'] } 
      });

      if (postingsToRemove.length === 0) {
        console.log('No postings to remove');
        return;
      }

      // Loop through and delete (or modify) each posting
      for (const posting of postingsToRemove) {
        // Delete the posting
        await DebtPosting.deleteOne({ _id: posting._id });
        // Or modify it as required
      }

      console.log(`${postingsToRemove.length} postings removed or modified`);
    } catch (error) {
      console.error('Error cleaning up postings:', error);
    } finally {
      mongoose.disconnect();
    }
  })
  .catch(err => console.error('MongoDB connection error:', err));
