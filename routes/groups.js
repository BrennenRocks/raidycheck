const express = require('express'),
  mongoose = require('mongoose'),
  middleware = require('../middleware'),
  axios = require('axios'),
  _ = require('lodash');

router = express.Router();

const User = require('../models/user'),
  Group = require('../models/group'),
  Character = require('../models/character');

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
    chars.push({ name: character.name, realm: character.realm, region: character.region });
  });

  // Assume none of the characters passed in are in the DB
  let charactersNotInDB = chars;

  Group.findOne({ _id: req.params.id }, (err, group) => {
    if (err) {
      return res.json({ success: false, message: 'Error: ', err });
    }
    
    if (!group) {
      return res.json({ success: false, message: 'Group not found' });
    }

    // Group found, find Characters
    Character.find({ cid: { $in: chars } }, (err, characters) => {
      if (err) {
        return res.json({ success: false, message: 'Error: ', err });
      }

      if (characters) {
        const dbChars = [];
        characters.map(character => {
          dbChars.push({ name: character.cid.name, realm: character.cid.realm, region: character.cid.region });
          group.characters.push(character._id);
        });

        // Separate the characters already in the DB from the characters we need to get info about
        charactersNotInDB = _.filter(chars, (char) => !_.find(dbChars, char));

        // If all characters were found in the DB, save group and return
        if (characters.length == chars.length) {
          group.save((err) => {
            if (err) {
              return res.json({ success: false, message: 'Error saving group to database: ', err });
            }

            // Find the group again to populate the characters before sending back to Front End
            Group.findById(group._id).populate('characters').exec((err, retGroup) => {
              if (err) {
                return res.json({ success: false, message: 'Error: ', err });
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
              return res.json({ success: false, message: 'Error saving characters to database: ', err });
            }

            newCharacters.map(char => {
              group.characters.push(char._id);
            });

            group.save((err) => {
              if (err) {
                return res.json({ success: false, message: 'Error saving group to database: ', err });
              }

              // Find the group again to populate the characters before sending back to Front End
              Group.findById(group._id).populate('characters').exec((err, retGroup) => {
                if (err) {
                  return res.json({ success: false, message: 'Error: ', err });
                }

                return res.json({ success: true, message: charactersNotFoundInArmory, group: retGroup });
              });
            });
          });
        })
        .catch(error => {
          return res.json({ success: false, message: 'Error: ', error });
        });
    });
  });
});

module.exports = router;