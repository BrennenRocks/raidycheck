const express = require('express'),
  passport = require('passport');

const router = express.Router()
const config = require('../config/database');
const middleware = require('../middleware');

const User = require('../models/user');

/*=========================
   Bnet OAuth Navigate to
===========================*/
router.get('/auth/bnet', (req, res, next) => {
  passport.authenticate('bnet-' + req.query.region, (err, user, info) => {
    if (err) {
      return next(err)
    }

    if (!user) {
      return res.redirect('/')
    }
    
    res.redirect('/');
  })(req, res, next);
});

/*============================
   Bnet OAuth Callback Route
==============================*/
router.get('/auth/bnet/callback', (req, res, next) => {
  passport.authenticate('bnet-' + req.query.region, { failureRedirect: process.env.DEVDOMAIN }, (err, user, info) => {
    res.set('Authorization', 'Bearer ' + user.jwt);
    res.redirect(process.env.DOMAIN + '/groups?new=' + user.isNewUser);
  })(req, res, next);
});

/*====================
   Logout Route
======================*/
router.get('/auth/logout', (req, res) => {
  req.logout();
});

module.exports = router;
