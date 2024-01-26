const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();
const auth=require('../middleware/auth');
const TransactionLog = require('../models/TransactionLog'); 

//const router = express.Router();

const tracer = require('dd-trace').init();

// User registration
router.post('/register', async (req, res) => {
  const span = tracer.startSpan('user.register');
  try {
    // Create a new user
    const user = new User(req.body);
    await user.save();

    // Send response
    res.status(201).send({ user });
    span.finish();
  } catch (error) {
    res.status(400).send(error.message);
    span.setTag('error', error);
    span.finish();
  }
});

// User login
router.post('/login', async (req, res) => {
  const span = tracer.startSpan('user.login');
  try {
    // Verify email and password
    const user = await User.findOne({ email: req.body.email });
    if (!user || !await bcrypt.compare(req.body.password, user.password)) {
      return res.status(401).send('Invalid login credentials');
    }

    // Generate a JWT token
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);

    // Send response
    res.send({ user: user.toObject({ getters: true }), token });
    span.finish();
  } catch (error) {
    res.status(500).send(error.message);
    span.setTag('error', error);
    span.finish();
  }
});

// In /routes/dashboardRoutes.js or /routes/userRoutes.js

router.get('/dashboard', auth, async (req, res) => {
  const span = tracer.startSpan('user.dashboard');
    try {
      // Retrieve debts owed by the user
      const debtsOwed = await DebtPosting.find({ borrower: req.user._id });
  
      // Retrieve debts where the user is the lender
      const debtsToReceive = await DebtPosting.find({ lender: req.user._id });
  
      // You can add more data as needed for the dashboard
      res.send({ debtsOwed, debtsToReceive });
      span.finish();
    } catch (error) {
      res.status(500).send(error.message);
      span.setTag('error', error);
      span.finish();
    }
});

router.patch('/update-wallet/:userId', auth, async (req, res) => {
  const span = tracer.startSpan('user.updateWallet');
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).send('User not found');
    }

    const amountToAdd = parseFloat(req.body.amount);
    if (isNaN(amountToAdd) || amountToAdd < 0) {
      return res.status(400).send('Invalid amount');
    }

    user.walletBalance += amountToAdd; // Assuming amount is passed in the request body
    await user.save();

    // Log for adding money (credit)
    const addLog = new TransactionLog({
      userId: req.user._id, // User's ID
      type: 'add',
      direction: 'credit',
      amount: amountToAdd // The amount added to the wallet
    });
    await addLog.save();

    res.send(user);
    span.finish();
  } catch (error) {
    res.status(400).send(error.message);
    span.setTag('error', error);
    span.finish();
  }
});


// router.get('/users/:userId/wallet-balance', auth, async (req, res) => {
//   try {
//     const user = await User.findById(req.params.userId);
//     if (!user) {
//       return res.status(404).send('User not found');
//     }
//     res.json({ walletBalance: user.walletBalance });
//   } catch (error) {
//     res.status(500).send(error.message);
//   }
// });

router.get('/wallet-balance/:userId', auth, async (req, res) => {
  const span = tracer.startSpan('user.walletBalance');
  try {
    // const userId = req.params.userId;
    // const user = await User.findById(userId);
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).send('User not found');
    }

    // Ensure walletBalance is initialized
    const walletBalance = user.walletBalance !== undefined ? user.walletBalance : 0;

    res.json({ walletBalance });
    span.finish();
  } catch (error) {
    res.status(500).send('Server error');
    span.setTag('error', error);
    span.finish();
  }
});

  
module.exports = router;
