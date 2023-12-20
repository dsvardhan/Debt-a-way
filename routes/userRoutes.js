const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth=require('../middleware/auth')

const router = express.Router();

// User registration
router.post('/register', async (req, res) => {
  try {
    // Create a new user
    const user = new User(req.body);
    await user.save();

    // Send response
    res.status(201).send({ user });
  } catch (error) {
    res.status(400).send(error.message);
  }
});

// User login
router.post('/login', async (req, res) => {
  try {
    // Verify email and password
    const user = await User.findOne({ email: req.body.email });
    if (!user || !await bcrypt.compare(req.body.password, user.password)) {
      return res.status(401).send('Invalid login credentials');
    }

    // Generate a JWT token
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);

    // Send response
    res.send({ user, token });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// In /routes/dashboardRoutes.js or /routes/userRoutes.js

router.get('/dashboard', auth, async (req, res) => {
    try {
      // Retrieve debts owed by the user
      const debtsOwed = await DebtPosting.find({ borrower: req.user._id });
  
      // Retrieve debts where the user is the lender
      const debtsToReceive = await DebtPosting.find({ lender: req.user._id });
  
      // You can add more data as needed for the dashboard
      res.send({ debtsOwed, debtsToReceive });
    } catch (error) {
      res.status(500).send(error.message);
    }
});
  
module.exports = router;
