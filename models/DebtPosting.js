// In /models/DebtPosting.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const debtPostingSchema = new mongoose.Schema({
    amount: { type: Number, required: true },
    interestRate: { type: Number, required: true },
    //dueDate: { type: Date, required: true },
    borrower: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Initially null
    isFulfilled: { type: Boolean, default: false }, // Indicates if the debt has been taken
    createdAt: { type: Date, default: Date.now }
  });
  
  module.exports = mongoose.model('DebtPosting', debtPostingSchema);
  