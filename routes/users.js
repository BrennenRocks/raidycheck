const express = require('express'),
  mongoose = require('mongoose'),
  _ = require('lodash'),
  fs = require('fs'),
  axios = require('axios');

router = express.Router();

const User = require('../models/user');

const middleware = require('../middleware'),
  constants = require('../config/constants');

/*========================
   Get logged in user
==========================*/
router.get('/users/personal', middleware.getAuthToken, (req, res) => {
  User.findOne({ _id: req.decodedUser.id }).populate('groups.personal').exec((err, user) => {
    if (err) {
      console.log('/users/personal finding User', err);
      return res.json({ success: false, message: constants.errMsg });
    }

    if (!user) {
      return res.json({ success: false, message: constants.userNotFound });
    }

    return res.json({ success: true, message: '', user: user });
  });
});

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

/*===========================
   Update user

   req.params {
      id - user's MongoDB Id
   }

   req.body {
     *image: String
   }
============================*/
router.put('/users/update/:userId', middleware.getAuthToken, (req, res) => {
  if (!req.body.image) {
    return res.json({ success: false, message: 'No image provided' });
  }

  User.findOne({ _id: req.decodedUser.id }, (err, user) => {
    if (err) {
      console.log('/users/update/:userId finding User', err);
      return res.json({ success: false, message: constants.errMsg });
    }

    if (!user) {
      return res.json({ success: false, message: constants.userNotFound });
    }

    let inset = _.replace(req.body.image, 'avatar', 'inset');
    axios.get('https://render-us.worldofwarcraft.com/character/' + inset, {
      responseType: 'arraybuffer'
    }).then(insetResponse => {
      let image = './images/characters/' + _.replace(_.toLower(user.bnet.battletag), '#', '-') + '-inset.jpg';
      fs.writeFile(image, Buffer.from(insetResponse.data, 'binary').toString('base64'), 'base64', (err) => {
        if (err) {
          console.log('/users/update/:userId downloading inset image')
        }

        user.inset = image;
      });

      axios.get('https://render-us.worldofwarcraft.com/character/' + req.body.image, {
        responseType: 'arraybuffer'
      }).then(response => {
        image = './images/characters/' +  _.replace(_.toLower(user.bnet.battletag), '#', '-') + '-avatar.jpg';
        fs.writeFile(image, Buffer.from(response.data, 'binary').toString('base64'), 'base64', (err) => {
          if (err) {
            console.log('/users/update/:userId downloading avatar image', err);
            return res.json({ success: false, message: constants.errMsg });
          }
  
          user.avatar = image;
          user.save((err, savedUser) => {
            if (err) {
              console.log('/users/update/:userId saving User', err);
              return res.json({ success: false, message: constants.errMsg });
            }
      
            return res.json({ success: true, message: '', user: savedUser });
          });
        });
      })
      .catch(err => {
        console.log('/users/update/:userId saving avatar image', err);
        return res.json({ success: false, message: contants.errMsg });
      });
    })
    .catch(err => {
      console.log('/users/update/:userId saving isnet image', err);
      return res.json({ success: false, message: contants.errMsg });
    });
  });
});

module.exports = router;
