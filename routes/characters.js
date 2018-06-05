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
router.post('/groups/:groupId/characters/add', middleware.getAuthToken, middleware.checkGroupOwnership, (req, res) => {
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

  Group.findOne({ _id: req.params.groupId }, (err, group) => {
    if (err) {
      console.log('/groups/:groupId/addCharacters finding group', err);
      return res.json({ success: false, message: constants.errMsg });
    }
    
    if (!group) {
      return res.json({ success: false, message: constants.groupNotFound });
    }

    // Group found, find Characters
    Character.find({ cid: { $in: chars } }, (err, characters) => {
      if (err) {
        console.log('/groups/:groupId/addCharacters finding characters', err);
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
              console.log('/groups/:groupId/addCharacters saving group', err);
              return res.json({ success: false, message: constants.errMsg });
            }

            // Find the group again to populate the characters before sending back to Front End
            Group.findById(group._id).populate('characters').exec((err, retGroup) => {
              if (err) {
                console.log('/groups/:groupId/addCharacters finding group', err);
                return res.json({ success: false, message: constants.errMsg });
              }

              return res.json({ success: true, message: '', group: retGroup });
            });
          });
        }
      }

      let charURLs = [];
      let charactersNotFoundInArmory = "";
      for (let i = 0; i < charactersNotInDbOrNotAlreadyInGroup.length; i++) {
          charURLs.push({
            url: "https://" + req.body.region + ".api.battle.net/wow/character/" +
          charactersNotInDbOrNotAlreadyInGroup[i].realm + "/" + charactersNotInDbOrNotAlreadyInGroup[i].name +
              "?fields=items&locale=en_US&apikey=" + process.env.BLIZZAPIKEY,
          name: charactersNotInDbOrNotAlreadyInGroup[i].name,
          realm: charactersNotInDbOrNotAlreadyInGroup[i].realm
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
          console.log('/groups/:groupId/addCharacters creating characters', err)
              return res.json({ success: false, message: constants.errMsg });
            }

            newCharacters.map(char => {
              group.characters.push(char._id);
            });

            group.save((err) => {
              if (err) {
            console.log('/groups/:groupId/addCharacters saving group', err)
                return res.json({ success: false, message: constants.errMsg });
              }

              // Find the group again to populate the characters before sending back to Front End
              Group.findById(group._id).populate('characters').exec((err, retGroup) => {
                if (err) {
              console.log('/groups/:groupId/addCharacters finding group', err);
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
        const data = response.data;
        let items = [];
        for (let key in data.items) {
          if (data.items.hasOwnProperty(key)) {
            if (data.items[key].name !== undefined && key !== "tabard" && key !== "shirt") {
              items.push(
                {
                  slot: key.charAt(0).toUpperCase() + key.slice(1),
                  id: data.items[key].id,
                  name: data.items[key].name,
                  icons: data.items[key].icon,
                  iLvl: data.items[key].itemLevel,
                  quality: data.items[key].quality,
                  bonusLists: data.items[key].bonusLists,
                  tooltipParams: data.items[key].tooltipParams,
                }
              );
            }
          }
        }
        
        char.lastModified = data.lastModified;
        char.iLvl = data.items.averageItemLevelEquipped;
        char.thumbnail = data.thumbnail;
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
  let i = -1;
  const inArray = req.rc_group.characters.some(char => {
    i++;
    return char.equals(req.params.charId);
  });
  console.log(inArray);
  if (!inArray) {
    return res.json({ success: false, message: 'Character doesn\'t exist in that group' });
  }

  req.rc_group.characters.splice(i, 1);

  req.rc_group.save((err, retGroup) => {
    if (err) {
      console.log('/groups/:groupId/characters/remove/:charId saving group', err);
      return res.json({ success: false, message: constants.errMsg });
    }

    return res.json({ success: true, message: '', group: retGroup });
  })
});

module.exports = router;