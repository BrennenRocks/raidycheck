const express = require('express'),
  mongoose = require('mongoose'),
  _ = require('lodash');
  
router = express.Router();
  
const User = require('../models/user'),
  Group = require('../models/group'),
  
const constants = require('../config/constants'),
  middleware = require('../middleware');

/*=======================
   Register a new group

   req.body {
     *title: String,
     isPublic: boolean,
     allowOthersToUpdateCharacters: boolean
   }
=========================*/
router.post('/groups/new', middleware.getAuthToken, (req, res) => {
  if (!req.body.title) {
    return res.json({ success: false, message: 'No title was provided' });
  }
  //Find out who is logged in so we can link the group to them
  User.findOne({ _id: req.decodedUser.id }, 'groups', (err, user) => {
    if (err) {
      console.log('/groups/new finding user', err);
      return res.json({ success: false, message: constants.errMsg });
    }

    if (!user) {
      return res.json({ success: false, message: constants.userNotFound });
    }

    new Group({
      title: req.body.title,
      owner: req.decodedUser.bnet.battletag,
      isPublic: req.body.isPublic,
      allowOthersToUpdateCharacters: req.body.allowOthersToUpdateCharacters,
    }).save((err, group) => {
      if (err) {
        if (err.errors.title) {
          return res.json({ success: false, message: err.errors.title.message });
        }
        
        console.log('/groups/new saving group', err);
        return res.json({ success: false, message: constants.errMsg });
      }
      //Attach the new group to the logged in user
      user.groups.personal.push(group._id);
      user.save((err) => {
        if (err) {
          console.log('groups/new saving user', err);
          return res.json({ success: false, message: constants.errMsg });
        }

        return res.json({ success: true, message: '', group: group });
      });
    });
  });
});

/*=====================
   Get a single group

   req.params {
     groupId - the Group ID
   }
=======================*/
router.get('/groups/:groupId', (req, res) => {
  Group.findOne({ _id: req.params.groupId }).populate('characters').exec((err, group) => {
    if (err) {
      console.log('/groups/:groupId finding group', err)
      return res.json({ success: false, message: constants.errMsg });
    }

    if (!group) {
      return res.json({ success: false, message: constants.groupNotFound });
    }

    return res.json({ success: true, message: '', group: group });
  });
});

/*===========================================
   Get all groups with characters populated
=============================================*/
router.get('/groups', middleware.getAuthToken, (req, res) => {
  User.findOne({ _id: req.decodedUser.id }).populate({ path: 'groups.favorites groups.personal', populate: { path: 'characters' } })
    .exec((err, user) => {
      if (err) {
        console.log('/groups finding User', err);
        return res.json({ success: false, message: constants.errMsg });
      }
      
      if (!user) {
        return res.json({ success: false, message: constants.userNotFound });
      }
      
      return res.json({ success: true, groups: user.groups });
    });
});

/*=======================
   Update a single group

   req.params {
     groupId - the Group ID
   }

   req.body {
     *title: String,
     *isPublic: boolean,
     *allowOthersToUpdateCharacters: boolean
   }
=========================*/
router.put('/groups/update/:groupId', middleware.getAuthToken, middleware.checkGroupOwnership, (req, res) => {
  if (!req.body.title) {
    return res.json({ success: false, message: 'No title provided' });
  }

  if (!req.body.isPublic) {
    return res.json({ success: false, message: 'No public or private field provided' });
  }

  if (!req.body.allowOthersToUpdateCharacters) {
    return res.json({ success: false, message: 'No option to allow others to update characters provided' });
  }

  Group.findOne({ _id: req.params.groupId }, (err, group) => {
    if (err) {
      console.log('/groups/update/:groupId finding group', err);
      return res.json({ success: false, message: constants.errMsg });
    }

    if (!group) {
      return res.json({ success: false, message: constants.groupNotFound });
    }

    group.title = req.body.title;
    group.isPublic = req.body.isPublic;
    group.allowOthersToUpdateCharacters = req.body.allowOthersToUpdateCharacters;

    group.save((err, savedGroup) => {
      if (err) {
        if (err.errors.title) {
          return res.json({ success: false, message: err.errors.title.message });
        }

        console.log('/groups/update/:groupId saving group', err); 
        return res.json({ success: false, message: constants.errMsg });
      }

      return res.json({ success: true, message: '', group: savedGroup });
    });
  });
});

/*=======================
   Delete a single group

   req.params {
     groupId - the Group ID
   }
=========================*/
router.delete('/groups/delete/:groupId', middleware.getAuthToken, middleware.checkGroupOwnership, (req, res) => {
  Group.findOne({ _id: req.params.groupId }, (err, group) => {
    if (err) {
      console.log('/groups/delete/:groupId finding group', err);
      return res.json({ success: false, message: constants.errMsg });
    }

    if (!group) {
      return res.json({ success: false, message: constants.groupNotFound });
    }

    group.remove(err => {
      if (err) {
        console.log('/groups/delete/:groupId removing group', err);
        return res.json({ success: false, message: constants.errMsg });
      }

      return res.json({ success: true, message: 'Group successfully deleted' });
    });
  });
});

/*=======================================
   Favorite or Unfavorite a single group

   req.params {
     groupId - the Group ID
   }
=========================================*/
router.put('/groups/favorite/:groupId', middleware.getAuthToken, (req, res) => {
  Group.findOne({ _id: req.params.groupId }, (err, group) => {
    if (err) {
      console.log('/groups/favorite/:groupId finding group', err);
      return res.json({ success: false, message: constants.errMsg });
    }

    if (!group) {
      return res.json({ success: false, message: constants.groupNotFound });
    }

    User.findOne({ _id: req.decodedUser.id }, (err, user) => {
      if (err) {
        console.log('/groups/favorite/:groupId finding user', err);
        return res.json({ success: false, message: constants.errMsg });
      }

      if (!user) {
        return res.json({ success: false, message: constants.userNotFound });
      }

      // If user has already favorited the group, decrement count and remove them
      if (_.includes(group.favoritedBy, user.bnet.battletag)) {
        user.groups.favorites.splice(user.groups.favorites.indexOf(group._id), 1);
        group.favoritesCount--;
        group.favoritedBy.splice(group.favoritedBy.indexOf(user.bnet.battletag), 1);
      } else {
        user.groups.favorites.push(group._id);
        group.favoritesCount++;
        group.favoritedBy.push(user.bnet.battletag);
      }
      
      group.save(err => {
        if (err) {
          console.log('/groups/favorite/:groupId saving group', err);
          return res.json({ success: false, message: constants.errMsg });
        }
        user.save(err => {
          if (err) {
            console.log('/groups/favorite/:groupId saving user', err);
            return res.json({ success: false, message: constants.errMsg });
          }

          return res.json({ success: true, message: '' });
        });
      });
    });
  });
});

module.exports = router;