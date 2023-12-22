const express = require('express');
const DebtPosting = require('../models/DebtPosting');
const router = express.Router();
const auth = require('../middleware/auth');

// Post a new debt
router.post('/', async (req, res) => {
  try {
    const debtPosting = new DebtPosting({...req.body,borrower:req.user._id});
    await debtPosting.save();
    res.status(201).send(debtPosting);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

// Get all debt postings
// router.get('/', async (req, res) => {
//   try {
//     const debtPostings = await DebtPosting.find({});
//     res.send(debtPostings);
//   } catch (error) {
//     res.status(500).send(error.message);
//   }
// });

// In /routes/debtPostingRoutes.js

// Get all unfulfilled debt postings
// router.get('/', async (req, res) => {
//     try {
//       const debtPostings = await DebtPosting.find({ isFulfilled: false });
//       res.send(debtPostings);
//     } catch (error) {
//       res.status(500).send(error.message);
//     }
// });
router.get('/', async (req, res) => {
  try {
    const debtPostings = await DebtPosting.find({ isFulfilled: false })
      .populate('borrower', 'username'); // Assuming 'name' is a field in your User model
    res.send(debtPostings);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Fetching debts owed by the user and their history
// router.get('/debts-owed-by/:userId', auth, async (req, res) => {
//   try {
//       const activeDebts = await DebtPosting.find({ borrower: req.user._id, isFulfilled: true, isPaid: false })
//           .populate('lender', 'username');
//       const paidDebts = await DebtPosting.find({ borrower: req.user._id, isFulfilled: true, isPaid: true })
//           .populate('lender', 'username');
//       res.json({ activeDebts, paidDebts });
//   } catch (error) {
//       res.status(500).json({ message: error.message });
//   }
// });

// // Fetching debts owed to the user and their history
// router.get('/debts-owed-to/:UserId', auth, async (req, res) => {
//   try {
//       const activeDebts = await DebtPosting.find({ lender: req.user._id, isFulfilled: true, isPaid: false })
//           .populate('borrower', 'username');
//       const paidDebts = await DebtPosting.find({ lender: req.user._id, isFulfilled: true, isPaid: true })
//           .populate('borrower', 'username');
//       res.json({ activeDebts, paidDebts });
//   } catch (error) {
//       res.status(500).json({ message: error.message });
//   }
// });

router.get('/debts-owed-by/:userId', auth,async (req, res) => {
  try {
      const debtsOwedByUser = await DebtPosting.find({ borrower: req.user._id, isFulfilled: true, isPaid:false })
          .populate('lender', 'username');
      res.json(debtsOwedByUser);
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});

router.get('/debts-owed-to/:UserId',auth, async (req, res) => {
  try {
      const debtsOwedToUser = await DebtPosting.find({ lender: req.user._id, isFulfilled: true, isPaid:false })
          .populate('borrower', 'username');
      res.json(debtsOwedToUser);
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});

router.get('/debts-history/:userId', auth, async (req, res) => {
  try {
      // Fetch debts where the user is either the lender or the borrower and the debt is paid
      const debtsHistory = await DebtPosting.find({
          $or: [{ lender: req.user._id }, { borrower: req.user._id }],
          isFulfilled: true, 
          isPaid: true
      }).populate('borrower lender', 'username');

      res.json(debtsHistory);
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});

// router.get('/debts-history/:UserId', auth, async (req, res) => {
//   try {
//       const userId = req.user._id;
//       const debtsHistory = await DebtPosting.find({
//           $or: [{ lender: userId }, { borrower: userId }],
//           isFulfilled: true, 
//           isPaid: true
//       }).populate('borrower lender', 'username');
//       res.json(debtsHistory);
//   } catch (error) {
//       res.status(500).json({ message: error.message });
//   }
// });


  
// In /routes/debtPostingRoutes.js

// Lend money to a debt posting
// router.patch('/lend/:id', async (req, res) => {
//     try {
//       const debtPosting = await DebtPosting.findByIdAndUpdate(req.params.id, { 
//         lender: req.body.lender, 
//         isFulfilled: true 
//       }, { new: true });
  
//       if (!debtPosting) {
//         return res.status(404).send('Debt posting not found');
//       }
  
//       res.send(debtPosting);
//     } catch (error) {
//       res.status(400).send(error.message);
//     }
// });

router.patch('/lend/:id', auth, async (req, res) => {
  try {
      const debtPosting = await DebtPosting.findById(req.params.id);

      // Check if the debt posting exists
      if (!debtPosting) {
          return res.status(404).send('Debt posting not found');
      }

      // Check if the user is trying to lend to their own posting
      if (debtPosting.borrower.toString() === req.user._id.toString()) {
          return res.status(400).send('Cannot lend to your own debt posting');
      }

      // Proceed with lending
      debtPosting.lender = req.user._id; // Assuming req.user._id contains the lender's ID
      debtPosting.isFulfilled = true;
      await debtPosting.save();

      res.send(debtPosting);
  } catch (error) {
      res.status(400).send(error.message);
  }
});


router.patch('/pay/:id', auth, async (req, res) => {
  try {
      const debtId = req.params.id;

      // Retrieve the debt posting
      const debtPosting = await DebtPosting.findById(debtId);
      if (!debtPosting) {
          return res.status(404).json({ message: 'Debt posting not found.' });
      }

      // Check if the user making the request is the one who owes the debt
      // Assume req.user._id contains the ID of the currently logged-in user
      if (debtPosting.borrower.toString() !== req.user._id.toString()) {
          return res.status(403).json({ message: 'You are not authorized to pay this debt.' });
      }

      // Update the debt posting to mark it as paid
      // You might want to adjust the properties based on your DebtPosting model
      debtPosting.isPaid = true; // Assuming 'isPaid' is a field in your model
      await debtPosting.save();

      res.json(debtPosting);
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});

  
module.exports = router;
