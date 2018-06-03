const express = require('express'),
  mongoose = require('mongoose'),
  _ = require('lodash');

router = express.Router();

const User = require('../models/user');

const middleware = require('../middleware'),
  constants = require('../config/constants');

/*============================================
   Get public user (used for public profile)

   req.params {
      battletag - user's Battle.net battletag
        (Passed in with - instead of # Ex: uglyer-1378)
   }
==============================================*/
router.get('/users/:battletag', (req, res) => {
  User.findOne({ "bnet.battletag":  _.replace(_.toLower(req.params.battletag), '-', '#') }).populate('groups').exec((err, user) => {
    if (err) {
      console.log('/users/:battletag finding user', err);
      return res.json({ success: false, message: constants.errMsg });
    }

    if (!user) {
      return res.json({ success: false, message: 'Battletag not found' });
    }

    return res.json({ success: true, message: '', user: user });
  });
});

module.exports = router;
