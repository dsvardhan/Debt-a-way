require('dotenv').config();
const express = require('express');
const DebtPosting = require('../models/DebtPosting');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User'); // Or the correct path to your User model
const TransactionLog = require('../models/TransactionLog'); // Update the path as necessary
const redisClient = require('../utils/redisClient');

// Utility functions for Redis operations using async/await
// Utility functions for Redis operations
async function cacheGet(key) {
  const data = await redisClient.get(key);
  return data ? JSON.parse(data) : null;
}

async function cacheSet(key, value, ttl = 3600) {
  await redisClient.set(key, JSON.stringify(value), 'EX', ttl);
}

router.get('/', async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 10;
  const lastId = req.query.lastId; // ID of the last item seen by the user
  const page = parseInt(req.query.page, 10) || 1;
  let cacheKey = `debtPostings:page:${page}`;
  if (lastId) {
    cacheKey += `:lastId:${lastId}`;
  }

  // Try to retrieve cached data
  let cachedData = await cacheGet(cacheKey);
  if (cachedData) {
    return res.status(200).json(cachedData);
  }

  // Build the query based on lastId for dynamic pagination
  let query = { isFulfilled: false };
  if (lastId) {
    query._id = { $lt: lastId };
  }

  const results = await DebtPosting.find(query)
    .sort({ _id: -1 })
    .limit(limit);

  // Cache the results before returning
  await cacheSet(cacheKey, results);

  res.status(200).json(results);
});


router.post('/', async (req, res) => {
  try {
    const debtPosting = new DebtPosting({ ...req.body, borrower: req.user._id });
    await debtPosting.save();

    // Optionally invalidate cache for the first page or update it to include this new debt
    // For simplicity, here we'll just invalidate the first page's cache
    await redisClient.del('debtPostings:page:1');

    res.status(201).send(debtPosting);
  } catch (error) {
    console.error('Error creating debt posting:', error);
    res.status(400).send(error.message);
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

      const transactionLog = new TransactionLog({
        userId: req.user._id, // Payer
        otherId: debtPosting.lender, // Receiver
        type: 'pay',
        direction: 'debit',
        amount: debtPosting.amount
      });
      await transactionLog.save();

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
  } catch (error) {
    res.status(500).send(error.message);
  }
});



router.get('/transaction-logs', auth, async (req, res) => {
  try {
    // Fetching logs where the user is either the initiator or involved in the transaction
    const transactionLogs = await TransactionLog.find({
      $or: [{ userId: req.user._id }, { otherId: req.user._id }]
    })
    .populate('userId otherId', 'username') // Populate with user details
    .sort({ date: -1 });

    res.json(transactionLogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



module.exports = router;
