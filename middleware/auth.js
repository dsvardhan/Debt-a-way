const tracer = require('dd-trace').init();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  const span = tracer.startSpan('authentication');
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    //const user = await User.findOne({ _id: decoded._id, 'tokens.token': token });
    const user = await User.findOne({ _id: decoded._id });

    if (!user) {
      throw new Error();
    }

    //req.token = token;
    req.user = user;
    next();
    span.finish();
  } catch (error) {
    res.status(401).send({ error: 'Please authenticate.' });
    span.setTag('error', error);
    span.finish();
  }
};

module.exports = auth;
