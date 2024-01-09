const mongoose = require('mongoose');

const transactionLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  otherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Optional, only used in two-party transactions
  },
  type: {
    type: String,
    required: true,
    enum: ['pay', 'debt-buy', 'add','lend']
  },
  direction: {
    type: String,
    required: true,
    enum: ['credit', 'debit']
  },
  amount: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  // Add other fields if necessary
});

const TransactionLog = mongoose.model('TransactionLog', transactionLogSchema);
module.exports = TransactionLog;
