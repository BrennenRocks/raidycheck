const express = require('express'),
  mongoose = require('mongoose'),
  middleware = require('../middleware'),
  axios = require('axios'),
  _ = require('lodash');

router = express.Router();

const User = require('../models/user'),
  Group = require('../models/group');
  //Character = require('../models/character');

/*=======================
   Register a new group 
=========================*/
router.post('/groups/new', middleware.getAuthToken, (req, res) => {
  if (!req.body.title) {
    return res.json({ success: false, message: 'No title was provided' });
  }
  //Find out who is logged in so we can link the group to them
  User.findOne({ _id: req.decodedUser.id }, 'groups', (err, user) => {
    if (err) {
      return res.json({ success: false, message: err });
    }
    
    if (!user) {
      return res.json({ success: false, message: 'User not found' });
    }

    let newGroup = new Group({
      title: req.body.title,
      owner: req.decodedUser.bnet.battletag,
      public: req.body.public
    }).save((err, group) => {
      if (err) {
        if (err.errors.title) {
          return res.json({ success: false, message: err.errors.title.message });
        }

        return res.json({ success: false, message: 'Error: ', err });
      }
      //Attach the new group to the logged in user
      user.groups.personal.push(group._id);
      user.save((err) => {
        if (err) {
          return res.json({ success: false, message: 'Error: ', err });
        }

        return res.json({ success: true, message: '', group: group });
      });
    });
  });
});

/*=====================
   Get a single group 
=======================*/
router.get('/groups/:id', middleware.getAuthToken, middleware.checkGroupOwnership, (req, res) => {
  Group.findOne({ _id: req.params.id }).populate('characters').exec((err, group) => {
    if (err) {
      return res.json({ success: false, message: 'Error: ', err });
    } 
    
    if (!group) {
      return res.json({ success: false, message: 'Group not found' });
    }
    
    return res.json({ success: true, message: '', group: group });
  });
});

module.exports = router;