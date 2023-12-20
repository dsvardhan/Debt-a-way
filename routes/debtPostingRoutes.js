const express = require('express');
const DebtPosting = require('../models/DebtPosting');
const router = express.Router();

// Post a new debt
router.post('/', async (req, res) => {
  try {
    const debtPosting = new DebtPosting(req.body);
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
router.get('/', async (req, res) => {
    try {
      const debtPostings = await DebtPosting.find({ isFulfilled: false });
      res.send(debtPostings);
    } catch (error) {
      res.status(500).send(error.message);
    }
});
  
// In /routes/debtPostingRoutes.js

// Lend money to a debt posting
router.patch('/lend/:id', async (req, res) => {
    try {
      const debtPosting = await DebtPosting.findByIdAndUpdate(req.params.id, { 
        lender: req.body.lender, 
        isFulfilled: true 
      }, { new: true });
  
      if (!debtPosting) {
        return res.status(404).send('Debt posting not found');
      }
  
      res.send(debtPosting);
    } catch (error) {
      res.status(400).send(error.message);
    }
});
  
module.exports = router;
