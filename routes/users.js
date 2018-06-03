const express = require('express'),
  middleware = require('../middleware'),
  _ = require('lodash');

router = express.Router();

const User = require('../models/user');

const mongoose = require('mongoose');

/*============================================
   Get public user (used for public profile)
==============================================*/
router.get('/users/:battletag', (req, res) => {
  User.findOne({ "bnet.battletag":  _.replace(_.toLower(req.params.battletag), '-', '#') }).populate('groups').exec((err, user) => {
    if (err) {
      console.log(err);
      return res.json({ success: false, message: 'There was a problem, please try again later' });
    }

    if (!user) {
      return res.json({ success: false, message: 'Battletag not found' });
    }

    return res.json({ success: true, message: '', user: user });
  });
});

module.exports = router;
