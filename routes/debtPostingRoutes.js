const express = require('express');
const DebtPosting = require('../models/DebtPosting');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User'); // Or the correct path to your User model


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


router.get('/', async (req, res) => {
  try {
    const debtPostings = await DebtPosting.find({ isFulfilled: false })
      .populate('borrower', 'username'); // Assuming 'name' is a field in your User model
    res.send(debtPostings);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

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



// router.patch('/lend/:id', auth, async (req, res) => {
//   try {
//       const debtPosting = await DebtPosting.findById(req.params.id);

//       // Check if the debt posting exists
//       if (!debtPosting) {
//           return res.status(404).send('Debt posting not found');
//       }

//       // Check if the user is trying to lend to their own posting
//       if (debtPosting.borrower.toString() === req.user._id.toString()) {
//           return res.status(400).send('Cannot lend to your own debt posting');
//       }

//       if (req.user.walletBalance < debtPosting.amount) {
//         return res.status(400).send('Insufficient wallet balance to lend');
//       }

      


//       // Proceed with lending
//       debtPosting.lender = req.user._id; // Assuming req.user._id contains the lender's ID
//       debtPosting.isFulfilled = true;
//       await debtPosting.save();

//       req.user.walletBalance -= debtPosting.amount; // Deduct amount from lender's wallet
//       await req.user.save();

//       const user = await User.findById(req.user._id);

//       res.send({debtPosting,user});
//   } catch (error) {
//       res.status(400).send(error.message);
//   }
// });

// router.patch('/lend/:id', auth, async (req, res) => {
//   try {
//       const debtPosting = await DebtPosting.findById(req.params.id);

//       if (!debtPosting) {
//           return res.status(404).send('Debt posting not found');
//       }

//       if (req.user.walletBalance < debtPosting.amount) {
//           return res.status(400).send('Insufficient wallet balance to lend');
//       }

//       debtPosting.lender = req.user._id;
//       debtPosting.isFulfilled = true;
//       await debtPosting.save();

//       req.user.walletBalance -= debtPosting.amount;
//       await req.user.save();

//       // Sending both the debt posting and the user's updated data
//       res.send({ debtPosting, user: req.user });
//   } catch (error) {
//       res.status(400).send(error.message);
//   }
// });

router.patch('/lend/:id', auth, async (req, res) => {
  try {
      const debtPosting = await DebtPosting.findById(req.params.id);

      if (!debtPosting) {
          return res.status(404).send('Debt posting not found');
      }

      // Check if the user is trying to lend to themselves
      if (debtPosting.borrower.toString() === req.user._id.toString()) {
          return res.status(400).send('You cannot lend to yourself');
      }

      if (req.user.walletBalance < debtPosting.amount) {
          return res.status(400).send('Insufficient wallet balance to lend');
      }

      debtPosting.lender = req.user._id;
      debtPosting.isFulfilled = true;
      await debtPosting.save();

      req.user.walletBalance -= debtPosting.amount;
      await req.user.save();

      // Sending both the debt posting and the user's updated data
      res.send({ debtPosting, user: req.user });
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
      
      if (debtPosting.amount > req.user.walletBalance) {
        return res.status(400).json({ message: 'Insufficient wallet balance.' });
      }
      
      req.user.walletBalance -= debtPosting.amount;
      await req.user.save();
      // Update the debt posting to mark it as paid
      // You might want to adjust the properties based on your DebtPosting model
      debtPosting.isPaid = true; // Assuming 'isPaid' is a field in your model
      await debtPosting.save();

      res.json({debtPosting,user:req.user});
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});


router.patch('/trade-debt/:id', auth, async (req, res) => {
  try {
    const debtPosting = await DebtPosting.findById(req.params.id);
    if (!debtPosting) {
      return res.status(404).send('Debt posting not found');
    }
    if (debtPosting.lender.toString() !== req.user._id.toString()) {
      return res.status(403).send('Only the lender can trade this debt');
    }
    debtPosting.isTradable = true;
    debtPosting.tradePrice = req.body.tradePrice;
    await debtPosting.save();
    res.send(debtPosting);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.get('/tradable-debts', async (req, res) => {
  try {
    const tradableDebts = await DebtPosting.find({ isTradable: true }).populate('borrower lender', 'username');
    res.send(tradableDebts);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// In your debtPostingRoutes.js or similar file
router.patch('/buy-debt/:debtId', auth, async (req, res) => {
  try {
    const debtId = req.params.debtId;
    const newLenderId = req.user._id; // The current user is the buyer

    const debtPosting = await DebtPosting.findById(debtId).populate('lender');

    if (!debtPosting) {
      return res.status(404).send('Debt posting not found');
    }

    if (!debtPosting.isTradable) {
      return res.status(400).send('This debt is not available for trading');
    }

    // Ensure the buyer is not the borrower
    if (debtPosting.borrower.equals(newLenderId)) {
      return res.status(400).send('Cannot buy your own debt');
    }

    if (debtPosting.lender.equals(newLenderId)) {
      return res.status(400).send('Cannot buy the debt you wish to trade');
    }

    const buyer = await User.findById(newLenderId);
    const seller = debtPosting.lender;

    // Check if the buyer has enough balance
    if (buyer.walletBalance < debtPosting.tradePrice) {
      return res.status(400).send('Insufficient balance to buy this debt');
    }

    // Update balances
    buyer.walletBalance -= debtPosting.tradePrice;
    seller.walletBalance += debtPosting.tradePrice;

    // Update the lender of the debt posting
    debtPosting.lender = newLenderId;
    debtPosting.isTradable = false; // Make the debt non-tradable after purchase

    await buyer.save();
    await seller.save();
    await debtPosting.save();

    res.json({ debtPosting, buyer, seller });
  } catch (error) {
    res.status(500).send(error.message);
  }
});


module.exports = router;
