const express = require('express');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');
const debtPostingRoutes = require('./routes/debtPostingRoutes');
const authMiddleware = require('./middleware/auth');
//const debtPostingRoutes = require('./routes/debtPostingRoutes');
const cors = require('cors');
require('dotenv').config();

const tracer = require('dd-trace').init();



const app = express();
app.use(cors());
const port = 5000;

// Middleware to parse JSON bodies
app.use(express.json());


const span = tracer.startSpan('mongodb.connection');
// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB...'))
  .catch(err => {
    console.error('Could not connect to MongoDB...', err);
    span.setTag('error', err);
    span.finish();
  });

// User Routes
app.use('/api/users', userRoutes);

// Debt Posting Routes
app.use('/api/debt-postings', authMiddleware, debtPostingRoutes);

//app.use('/api', debtPostingRoutes);
// Start the server
app.listen(port, () => {
  const span = tracer.startSpan('server.start');
  console.log(`Server running at https://debt-a-way.onrender.com/ `);
  span.finish();
});
