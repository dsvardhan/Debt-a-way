const express = require('express');
const DebtPosting = require('../models/DebtPosting');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User'); // Or the correct path to your User model
const TransactionLog = require('../models/TransactionLog'); // Update the path as necessary

const tracer = require('dd-trace').init();

// Post a new debt
router.post('/', async (req, res) => {
  const span = tracer.startSpan('debtPosting.create');
  try {
    const debtPosting = new DebtPosting({...req.body,borrower:req.user._id});
    await debtPosting.save();
    res.status(201).send(debtPosting);
    span.finish();
  } catch (error) {
    res.status(400).send(error.message);
    span.setTag('error', error);
    span.finish();
  }
});


router.get('/', async (req, res) => {
  const span = tracer.startSpan('debtPosting.list');
  try {
    const debtPostings = await DebtPosting.find({ isFulfilled: false })
      .populate('borrower', 'username'); // Assuming 'name' is a field in your User model
    res.send(debtPostings);
    span.finish();
  } catch (error) {
    res.status(500).send(error.message);
    span.setTag('error', error);
    span.finish();
  }
});

router.get('/debts-owed-by/:userId', auth,async (req, res) => {
  const span = tracer.startSpan('debtPosting.debtsOwedBy');
  try {
      const debtsOwedByUser = await DebtPosting.find({ borrower: req.user._id, isFulfilled: true, isPaid:false })
          .populate('lender', 'username');
      res.json(debtsOwedByUser);
      span.finish();
  } catch (error) {
      res.status(500).json({ message: error.message });
      span.setTag('error', error);
      span.finish();
  }
});

router.get('/debts-owed-to/:UserId',auth, async (req, res) => {
  const span = tracer.startSpan('debtPosting.debtsOwedTo');
  try {
      const debtsOwedToUser = await DebtPosting.find({ lender: req.user._id, isFulfilled: true, isPaid:false })
          .populate('borrower', 'username');
      res.json(debtsOwedToUser);
      span.finish();
  } catch (error) {
      res.status(500).json({ message: error.message });
      span.setTag('error', error);
      span.finish();
  }
});

router.get('/debts-history/:userId', auth, async (req, res) => {
  const span = tracer.startSpan('debtPosting.history');
  try {
      // Fetch debts where the user is either the lender or the borrower and the debt is paid
      const debtsHistory = await DebtPosting.find({
          $or: [{ lender: req.user._id }, { borrower: req.user._id }],
          isFulfilled: true, 
          isPaid: true
      }).populate('borrower lender', 'username');

      res.json(debtsHistory);
      span.finish();
  } catch (error) {
      res.status(500).json({ message: error.message });
      span.setTag('error', error);
      span.finish();
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
  const span = tracer.startSpan('debtPosting.lend');
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

      const transactionLog = new TransactionLog({
        userId: req.user._id, // Lender
        otherId: debtPosting.borrower, // Borrower
        type: 'lend',
        direction: 'debit',
        amount: debtPosting.amount
      });
      await transactionLog.save();

      // Sending both the debt posting and the user's updated data
      res.send({ debtPosting, user: req.user });
      span.finish();
  } catch (error) {
      res.status(400).send(error.message);
      span.setTag('error', error);
      span.finish();
  }
});


router.patch('/pay/:id', auth, async (req, res) => {
  const span = tracer.startSpan('debtPosting.pay');
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

      const transactionLog = new TransactionLog({
        userId: req.user._id, // Payer
        otherId: debtPosting.lender, // Receiver
        type: 'pay',
        direction: 'debit',
        amount: debtPosting.amount
      });
      await transactionLog.save();

      res.json({debtPosting,user:req.user});
      span.finish();
  } catch (error) {
      res.status(500).json({ message: error.message });
      span.setTag('error', error);
      span.finish();
  }
});


router.patch('/trade-debt/:id', auth, async (req, res) => {
  const span = tracer.startSpan('debtPosting.tradeDebt');
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
    span.finish();
  } catch (error) {
    res.status(500).send(error.message);
    span.setTag('error', error);
    span.finish();
  }
});

router.get('/tradable-debts', async (req, res) => {
  const span = tracer.startSpan('debtPosting.tradableDebtsList');
  try {
    const tradableDebts = await DebtPosting.find({ isTradable: true }).populate('borrower lender', 'username');
    res.send(tradableDebts);
    span.finish();
  } catch (error) {
    res.status(500).send(error.message);
    span.setTag('error', error);
    span.finish();
  }
});

// In your debtPostingRoutes.js or similar file
router.patch('/buy-debt/:debtId', auth, async (req, res) => {
  const span = tracer.startSpan('debtPosting.buyDebt');
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

    const oldLenderId=debtPosting.lender;
    // Update the lender of the debt posting
    debtPosting.lender = newLenderId;
    debtPosting.isTradable = false; // Make the debt non-tradable after purchase

    await buyer.save();
    await seller.save();
    await debtPosting.save();

    const transactionLog = new TransactionLog({
      userId: req.user._id, // Buyer
      otherId: oldLenderId, // Seller
      type: 'debt-buy',
      direction: 'debit',
      amount: debtPosting.tradePrice
    });
    await transactionLog.save();


    res.json({ debtPosting, buyer, seller });
    span.finish();
  } catch (error) {
    res.status(500).send(error.message);
    span.setTag('error', error);
    span.finish();
  }
});


// Fetch transaction logs for the logged-in user
// router.get('/transaction-logs', auth, async (req, res) => {
//   try {
//     const transactionLogs = await TransactionLog.find({ userId: req.user._id })
//       .populate('receiverId', 'username') // Populate with necessary fields from the User model
//       .sort({ createdAt: -1 }); // Assuming you have a createdAt field for sorting

//     res.json(transactionLogs);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });
//router.get('/transaction-logs', auth, async (req, res) => {
  // try {
  //   const transactionLogs = await TransactionLog.find({ userId: req.user._id })
  //     .populate('receiverId', 'username') // Adjust the fields based on your User model
  //     .sort({ date: -1 });

  //   const formattedLogs = transactionLogs.map(log => ({
  //     date: log.date,
  //     amount: log.amount,
  //     type: log.type,
  //     otherParty: log.receiverId ? log.receiverId.username : 'N/A'
  //   }));

  //   res.json(formattedLogs);
  // } catch (error) {
  //   res.status(500).json({ message: error.message });
  // }


//   try {
//     // Fetching logs where the user is either the initiator or the receiver
//     const transactionLogs = await TransactionLog.find({
//       $or: [{ userId: req.user._id }, { receiverId: req.user._id }]
//     })
//     .populate('userId receiverId', 'username') // Adjust fields based on your User model
//     .sort({ date: -1 });

//     // Format logs for a more user-friendly output
//     const formattedLogs = transactionLogs.map(log => {
//       let otherParty = log.userId.toString() === req.user._id.toString() ?
//                        (log.receiverId ? log.receiverId.username : 'N/A') :
//                        log.userId.username;

//       // Determine the direction for the user
//       let direction = log.userId.toString() === req.user._id.toString() ? log.direction : (log.direction === 'credit' ? 'debit' : 'credit');

//       return {
//         date: log.date,
//         amount: log.amount,
//         type: log.type,
//         direction: direction,
//         otherParty: otherParty
//       };
//     });

//     res.json(formattedLogs);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// router.get('/transaction-logs', auth, async (req, res) => {
//   try {
//     const transactionLogs = await TransactionLog.find({
//       $or: [{ userId: req.user._id }, { receiverId: req.user._id }]
//     })
//     .populate('userId receiverId', 'username') // Ensure these fields match your User model
//     .sort({ date: -1 });

//     const formattedLogs = transactionLogs.map(log => {
//       let otherParty = log.userId.toString() === req.user._id.toString() ?
//                        (log.receiverId ? log.receiverId.username : 'N/A') :
//                        log.userId.username;

//       let direction = log.userId.toString() === req.user._id.toString() ? 
//                       log.direction : 
//                       (log.direction === 'credit' ? 'debit' : 'credit');

//       return {
//         date: log.date,
//         amount: log.amount,
//         type: log.type, // Ensure this is the correct field from your model
//         direction: direction,
//         otherParty: otherParty
//       };
//     });

//     res.json(formattedLogs);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });



// router.get('/transaction-logs', auth, async (req, res) => {
//   try {
//     // Fetching logs where the user is either the initiator or the receiver
//     const transactionLogs = await TransactionLog.find({
//       $or: [{ userId: req.user._id }, { receiverId: req.user._id }]
//     })
//     .populate('userId receiverId', 'username') // Adjust fields based on your User model
//     .sort({ date: -1 });

//     // Format logs for a more user-friendly output
//     const formattedLogs = transactionLogs.map(log => {
//       let otherParty = log.userId.toString() === req.user._id.toString() ?
//                        (log.receiverId ? log.receiverId.username : 'N/A') :
//                        log.userId.username;

//       let direction = log.userId.toString() === req.user._id.toString() ? 
//                       log.direction : 
//                       (log.direction === 'credit' ? 'debit' : 'credit');

//       return {
//         date: log.date,
//         amount: log.amount,
//         type: log.type, // Ensure this is the correct field from your model
//         direction: direction,
//         otherParty: otherParty
//       };
//     });

//     res.json(formattedLogs);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });


// router.get('/transaction-logs', auth, async (req, res) => {
//   try {
//     // Fetching logs where the user is either the initiator or involved in the transaction
//     const transactionLogs = await TransactionLog.find({
//       $or: [{ userId: req.user._id }, { otherId: req.user._id }]
//     })
//     .populate('userId otherId', 'username') // Populate with user details
//     .sort({ date: -1 });

//     // Format logs for a user-friendly output
//     const formattedLogs = transactionLogs.map(log => {
//       let otherParty = log.userId.toString() === req.user._id.toString() ?
//                        (log.otherId ? log.otherId.username : 'N/A') :
//                        log.userId.username;

//       return {
//         date: log.date,
//         amount: log.amount,
//         type: log.type,
//         direction: log.userId.toString() === req.user._id.toString() ? 'debit' : 'credit', // Direction relative to the user
//         otherParty: otherParty
//       };
//     });

//     res.json(formattedLogs);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });


router.get('/transaction-logs', auth, async (req, res) => {
  const span = tracer.startSpan('debtPostingtransactionLog');
  try {
    // Fetching logs where the user is either the initiator or involved in the transaction
    const transactionLogs = await TransactionLog.find({
      $or: [{ userId: req.user._id }, { otherId: req.user._id }]
    })
    .populate('userId otherId', 'username') // Populate with user details
    .sort({ date: -1 });

    res.json(transactionLogs);
    span.finish();
  } catch (error) {
    res.status(500).json({ message: error.message });
    span.setTag('error', error);
    span.finish();
  }
});



module.exports = router;
