const express = require('express'),
  middleware = require('../middleware');

router = express.Router();

const User = require('../models/user');

const mongoose = require('mongoose');

/*=====================================================
   Get full User with groups and characters populated
=======================================================*/
router.get('/users/me', middleware.getAuthToken, (req, res) => {
  User.findOne({ _id: req.decodedUser.id }).populate({ path: 'groups.favorites groups.personal', populate: { path: 'characters' } })
    .exec((err, user) => {
      if (err) {
        return res.json({ success: false, message: 'Error: ', err });
      }
      
      if (!user) {
        return res.json({ success: false, message: 'User not found' });
      }
      
      return res.json({ success: true, user: user });
    });
});

/*==================
   Get public user
====================*/
router.get('/users/:id', (req, res) => {

});

