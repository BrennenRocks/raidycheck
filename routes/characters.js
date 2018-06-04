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

/*==============================================================
   Add Characters from either DB or BlizzardAPI to your Group

   req.params {
     id - the Group ID
   }

   req.body {
     *region: String,
     *characters: [
       {
         *name: String,
         *realm: String
       }
     ]
   }

   returns the group
================================================================*/
router.post('/groups/:id/characters/add', middleware.getAuthToken, middleware.checkGroupOwnership, (req, res) => {
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
      return res.json({ success: false, message: constants.groupNotFound });
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

/*============================================
   Update a character from Blizzard API

   req.params {
     groupId - Group id that the character is in
     charId - Character id to update
   }

   returns the group
==============================================*/
router.put('/groups/:groupId/characters/update/:charId', middleware.getAuthToken, (req, res) => {
  Group.findOne({ _id: req.params.groupId }, (err, group) => {
    if (err) {
      console.log('/groups/:groupId/characters/update/:charId finding group', err);
      return res.json({ success: false, message: constants.errMsg });
    }

    if (!group) {
      return res.json({ success: false, message: constants.groupNotFound });
    }

    if (!group.allowOthersToUpdateCharacters && req.decodedUser.bnet.battletag !== group.owner) {
      return res.json({ success: false, message: 'You don\'t have permission to do that' });
    }

    Character.findOne({ _id: req.params.charId }, (err, char) => {
      if (err) {
        console.log('/groups/:groupId/characters/update/:charId finding character', err);
        return res.json({ success: false, message: constants.errMsg });
      }
      
      if (!char) {
        return res.json({ success: false, message: constants.charNotFound });
      }
      
      axios({
        method: 'get',
        url: "https://" + char.cid.region + ".api.battle.net/wow/character/" +
        char.cid.realm + "/" + char.cid.name +
        "?fields=items&locale=en_US&apikey=" + process.env.BLIZZAPIKEY,
      })
      .then(response => {
        let items = [];
        for (let key in response.items) {
          if (response.items.hasOwnProperty(key)) {
            if (response.items[key].name !== undefined && key !== "tabard" && key !== "shirt") {
              items.push(
                {
                  slot: key.charAt(0).toUpperCase() + key.slice(1),
                  id: response.items[key].id,
                  name: response.items[key].name,
                  icons: response.items[key].icon,
                  iLvl: response.items[key].itemLevel,
                  quality: response.items[key].quality,
                  bonusLists: response.items[key].bonusLists,
                  tooltipParams: response.items[key].tooltipParams,
                }
              );
            }
          }
        }
        
        char.lastModified = response.lastModified;
        char.iLvl = response.items.averageItemLevelEquipped;
        char.thumbnail = response.thumbnail;
        char.lastUpdated = new Date();
        char.items = items;
        
        char.save((err, savedChar) => {
          if (err) {
            console.log('/groups/:groupId/characters/update/:charId saving char', err);
            return res.json({ success: false, message: constants.errMsg });
          }
          
          return res.json({ success: true, message: '', group: group });
        });
      })
      .catch(error => {
        console.log('error with axios updating character', error);
        return done(constants.errMsg);
      });
    })
  });
});

/*=================================================
   Remove character from your group but not the DB

   req.params {
     groupId - Group id that the character is in
     charId - Character id to update
   }

   returns the group
===================================================*/
router.put('/groups/:groupId/characters/remove/:charId', middleware.getAuthToken, middleware.checkGroupOwnership, (req, res) => {
  if (!_.includes(req.rc_group.characters, req.params.charId)) {
    return res.json({ success: false, message: 'Character doesn\'t exist in that group' });
  }

  req.rc_group.characters.splice(req.rc_group.characters.indexOf(req.params.charId), 1);

  req.rc_group.save((err, retGroup) => {
    if (err) {
      console.log('/groups/:groupId/characters/remove/:charId saving group', err);
      return res.json({ success: false, message: constants.errMsg });
    }

    return res.json({ success: true, message: '', group: retGroup });
  })
});

module.exports = router;