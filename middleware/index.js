const jwt = require('jsonwebtoken');
const config = require('../config/database'),
  Util = require('../config/util');

const User = require('../models/user'),
  Group = require('../models/group');

let middlewareObj = {};

middlewareObj.getAuthToken = (req, res, next) => {
  if (!req.headers.authorization) {
    return res.json({ success: false, message: 'No Token provided' });
  }

  const token = req.headers.authorization.split(" ")[1];
  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.json({ success: false, message: 'Please log out and log back in' });
    }

    req.decodedUser = decoded;
    next();
  });
};

middlewareObj.checkGroupOwnership = (req, res, next) => {
  User.findOne({ _id: req.decodedUser.id }, 'bnet', (err, user) => {
    if (err) {
      return res.json({ success: false, message: err });
    }
    
    if (!user) {
      return res.json({ success: false, message: 'User not found' });
    }

    Group.findOne({ _id: req.params.id }, (err, group) => {
      if (err) {
        return res.json({ success: false, message: 'Group not found' });
      }

      if (!Util.isEqualString(user.bnet.battletag, group.owner)) {
        return res.json({ success: false, message: "You don't have permission to do that" });
      }
      
      next();
    });
  });
}

module.exports = middlewareObj;