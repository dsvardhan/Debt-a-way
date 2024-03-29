const express = require('express');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');
const debtPostingRoutes = require('./routes/debtPostingRoutes');
const authMiddleware = require('./middleware/auth');
//const debtPostingRoutes = require('./routes/debtPostingRoutes');
const cors = require('cors');
require('dotenv').config();


const app = express();
app.use(cors());
const port = 5000;

// Middleware to parse JSON bodies
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 35 // Set the pool size to 10 connections
  })
  .then(() => console.log('Connected to MongoDB...'))
  .catch(err => console.error('Could not connect to MongoDB...', err));

// User Routes
app.use('/api/users', userRoutes);

// Debt Posting Routes
app.use('/api/debt-postings', authMiddleware, debtPostingRoutes);

//app.use('/api', debtPostingRoutes);
// Start the server
app.listen(port, () => {
  console.log(`Server running`);
});
