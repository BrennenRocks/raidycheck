const jwt = require('jsonwebtoken');
const config = require('../config/database');

const User = require('../models/user');

let middlewareObj = {};

middlewareObj.getAuthToken = (req, res, next) => {
  if (!req.headers.authorization) {
    return res.json({ success: false, message: 'No Token provided' });
  }
  const token = req.headers.authorization.split(" ")[1];

  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      console.log(err);
      return res.json({ success: false, message: 'Please log out and log back in' });
    }

    req.decodedUser = decoded;
    next();
  });
};

module.exports = middlewareObj;