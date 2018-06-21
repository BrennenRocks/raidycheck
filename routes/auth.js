const express = require('express'),
  passport = require('passport'),
  querystring = require('querystring');

const router = express.Router()
const constants = require('../config/constants');

/*=========================
   Bnet OAuth Navigate to
===========================*/
router.get('/auth/bnet', (req, res, next) => {
  passport.authenticate('bnet-' + req.query.region, (err, user, info) => {
    if (err) {
      console.log('/auth/bnet', err);
      return next(constants.errMsg)
    }
  })(req, res, next);
});

/*============================
   Bnet OAuth Callback Route
==============================*/
router.get('/auth/bnet/callback', (req, res, next) => {
  passport.authenticate('bnet-' + req.query.region, { failureRedirect: process.env.DEVDOMAIN }, (err, user, info) => {
    if (err) {
      console.log('/auth/bnet/callback', err);
      return next(constants.errMsg);
    }

    console.log(user.jwt);
    const body = {
      'new': user.isNewUser,
      'rc_token': user.jwt
    }
    res.redirect(process.env.DOMAIN + '/logging-in?' + querystring.stringify(body));
  })(req, res, next);
});

/*====================
   Logout Route
======================*/
router.get('/auth/logout', (req, res) => {
  req.logout();
});

module.exports = router;
