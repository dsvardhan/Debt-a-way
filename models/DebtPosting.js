// In /models/DebtPosting.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const debtPostingSchema = new mongoose.Schema({
    amount: { type: Number, required: true },
    interestRate: { type: Number, required: true },
    //dueDate: { type: Date, required: true },
    borrower: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Initially null
    isFulfilled: { type: Boolean, default: false }, 
    isPaid: { type: Boolean, default: false },// Indicates if the debt has been taken
    createdAt: { type: Date, default: Date.now },
    isTradable: { type: Boolean, default: false },
    tradePrice: { type: Number,default:null }

  });

  debtPostingSchema.index({ isFulfilled: 1 }); // Add this line

  
  module.exports = mongoose.model('DebtPosting', debtPostingSchema);
  