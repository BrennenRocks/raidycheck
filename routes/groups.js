const express = require('express'),
  mongoose = require('mongoose'),
  axios = require('axios'),
  _ = require('lodash');
  
router = express.Router();
  
const User = require('../models/user'),
  Group = require('../models/group'),
  Character = require('../models/character');
  
const constants = require('../config/constants'),
  middleware = require('../middleware');

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
      console.log('/groups/new finding user', err);
      return res.json({ success: false, message: constants.errMsg });
    }

    if (!user) {
      return res.json({ success: false, message: 'User not found' });
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
=======================*/
router.get('/groups/:id', (req, res) => {
  Group.findOne({ _id: req.params.id }).populate('characters').exec((err, group) => {
    if (err) {
      console.log('/groups/:id finding group', err)
      return res.json({ success: false, message: constants.errMsg });
    }

    if (!group) {
      return res.json({ success: false, message: 'Group not found' });
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
        return res.json({ success: false, message: 'User not found' });
      }
      
      return res.json({ success: true, groups: user.groups });
    });
});

/*=======================
   Update a single group 
=========================*/
router.put('/groups/update/:id', middleware.getAuthToken, middleware.checkGroupOwnership, (req, res) => {
  if (!req.body.title) {
    return res.json({ success: false, message: 'No title provided' });
  }

  if (!req.body.isPublic) {
    return res.json({ success: false, message: 'No public or private field provided' });
  }

  if (!req.body.allowOthersToUpdateCharacters) {
    return res.json({ success: false, message: 'No option to allow others to update characters provided' });
  }

  Group.findOne({ _id: req.params.id }, (err, group) => {
    if (err) {
      console.log('/groups/update/:id finding group', err);
      return res.json({ success: false, message: constants.errMsg });
    }

    if (!group) {
      return res.json({ success: false, message: 'Group not found' });
    }

    group.title = req.body.title;
    group.isPublic = req.body.isPublic;
    group.allowOthersToUpdateCharacters = req.body.allowOthersToUpdateCharacters;

    group.save((err, savedGroup) => {
      if (err) {
        if (err.errors.title) {
          return res.json({ success: false, message: err.errors.title.message });
        }

        console.log('/groups/update/:id saving group', err); 
        return res.json({ success: false, message: constants.errMsg });
      }

      return res.json({ success: true, message: '', group: savedGroup });
    });
  });
});

/*=======================
   Delete a single group 
=========================*/
router.delete('/groups/delete/:id', middleware.getAuthToken, middleware.checkGroupOwnership, (req, res) => {
  Groups.findOne({ _id: req.params.id }, (err, group) => {
    if (err) {
      console.log('/groups/delete/:id finding group', err);
      return res.json({ success: false, message: constants.errMsg });
    }

    if (!group) {
      return res.json({ success: false, message: 'Group not found' });
    }

    group.remove(err => {
      if (err) {
        console.log('/groups/delete/:id removing group', err);
        return res.json({ success: false, message: constants.errMsg });
      }

      return res.json({ success: true, message: '' });
    });
  });
});


// TODO: Move to characters.js route file
/*==============================================================
   Add Characters from either DB or BlizzardAPI to your Group
================================================================*/
router.post('/groups/:id/addCharacters', middleware.getAuthToken, middleware.checkGroupOwnership, (req, res) => {
  if (!req.body) {
    return res.json({ success: false, message: 'No characters provided' });
  }

  if (req.body.characters && !_.isArray(req.body.characters)) {
    return res.json({ success: false, message: 'Must pass in an array' });
  }

  // if (req.body.characters.length > 3) {
  //   return res.json({ success: false, message: 'Can not get more than 3 characters' });
  // }

  if(!req.body.region) {
    return res.json({ success: false, message: 'No region provided' });
  }

  const chars = [];
  req.body.characters.map(character => {
    chars.push({ name: character.name, realm: character.realm, region: req.body.region });
  });

  // Assume none of the characters passed in are in the DB
  let charactersNotInDB = chars;

  Group.findOne({ _id: req.params.id }, (err, group) => {
    if (err) {
      console.log('/groups/:id/addCharacters finding group', err);
      return res.json({ success: false, message: constants.errMsg });
    }
    
    if (!group) {
      return res.json({ success: false, message: 'Group not found' });
    }

    // Group found, find Characters
    Character.find({ cid: { $in: chars } }, (err, characters) => {
      if (err) {
        console.log('/gruops/:id/addCharacters finding characters', err);
        return res.json({ success: false, message: constants.errMsg });
      }

      if (characters) {
        const dbChars = [];
        characters.map(character => {
          dbChars.push({ name: character.cid.name, realm: character.cid.realm, region: req.body.region });
          group.characters.push(character._id);
        });

        // Separate the characters already in the DB from the characters we need to get info about
        charactersNotInDB = _.differenceWith(chars, dbChars, _.isEqual);

        // If all characters were found in the DB, save group and return
        if (characters.length == chars.length) {
          group.save((err) => {
            if (err) {
              console.log('/groups/:id/addCharacters saving group', err);
              return res.json({ success: false, message: constants.errMsg });
            }

            // Find the group again to populate the characters before sending back to Front End
            Group.findById(group._id).populate('characters').exec((err, retGroup) => {
              if (err) {
                console.log('/groups/:id/addCharacters finding group', err);
                return res.json({ success: false, message: constants.errMsg });
              }

              return res.json({ success: true, message: '', group: retGroup });
            });
          });
        }
      }

      // 1 or more characters not found in DB, add them to DB
      let charURLs = [];
      let charactersNotFoundInArmory = "";
      for (let i = 0; i < charactersNotInDB.length; i++) {
        charURLs.push({
          url: "https://" + req.body.region + ".api.battle.net/wow/character/" +
            charactersNotInDB[i].realm + "/" + charactersNotInDB[i].name +
            "?fields=items&locale=en_US&apikey=" + process.env.BLIZZAPIKEY,
          name: charactersNotInDB[i].name,
          realm: charactersNotInDB[i].realm
        });
      }

      let promiseArray = charURLs.map(char => axios.get(char.url).catch(err => {
        charactersNotFoundInArmory += char.name + ' - ' + char.realm + ' not found in WoW armory\n';
        return null;
      }));

      const newChars = [];
      axios.all(promiseArray)
        .then(response => {
          // Remove the nulls (errored out) responses
          response = _.compact(response);
          const resChars = response.map(r => r.data);
          let items = [];
          for (let i = 0; i < resChars.length; i++) {
            for (let key in resChars[i].items) {
              if (resChars[i].items.hasOwnProperty(key)) {
                if (resChars[i].items[key].name !== undefined && key !== "tabard" && key !== "shirt") {
                  items.push(
                    {
                      slot: key.charAt(0).toUpperCase() + key.slice(1),
                      id: resChars[i].items[key].id,
                      name: resChars[i].items[key].name,
                      icons: resChars[i].items[key].icon,
                      iLvl: resChars[i].items[key].itemLevel,
                      quality: resChars[i].items[key].quality,
                      bonusLists: resChars[i].items[key].bonusLists,
                      tooltipParams: resChars[i].items[key].tooltipParams,
                    }
                  );
                }
              }
            }

            newChars.push(new Character({
              cid: {
                name: resChars[i].name,
                realm: resChars[i].realm,
                region: req.body.region,
              },
              lastModified: resChars[i].lastModified,
              iLvl: resChars[i].items.averageItemLevelEquipped,
              class: resChars[i].class,
              thumbnail: resChars[i].thumbnail,
              lastUpdated: new Date(),
              items: items
            }));
            items = [];
          }

          Character.create(newChars, (err, newCharacters) => {
            if (err) {
              console.log('/groups/:id/addCharacters creating characters', err)
              return res.json({ success: false, message: constants.errMsg });
            }

            newCharacters.map(char => {
              group.characters.push(char._id);
            });

            group.save((err) => {
              if (err) {
                console.log('/groups/:id/addCharacters saving group', err)
                return res.json({ success: false, message: constants.errMsg });
              }

              // Find the group again to populate the characters before sending back to Front End
              Group.findById(group._id).populate('characters').exec((err, retGroup) => {
                if (err) {
                  console.log('/groups/:id/addCharacters finding group', err);
                  return res.json({ success: false, message: constants.errMsg });
                }

                return res.json({ success: true, message: charactersNotFoundInArmory, group: retGroup });
              });
            });
          });
        })
        .catch(error => {
          console.log('Error with Axios get User characters', error);
          return res.json({ success: false, message: constants.errMsg });
        });
    });
  });
});

module.exports = router;