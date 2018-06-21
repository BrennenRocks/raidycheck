const passport = require('passport'),
  BnetStrategy = require('passport-bnet').Strategy,
  mongoose = require('mongoose'),
  axios = require('axios'),
  _ = require('lodash');

const User = require('../models/user');

const constants = require('./constants');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

passport.use('bnet-us', new BnetStrategy({
  clientID: process.env.BLIZZAPIKEY,
  clientSecret: process.env.BLIZZSECRET,
  scope: 'wow.profile',
  callbackURL: process.env.DEVDOMAIN + '/api/auth/bnet/callback?region=us',
  region: 'us',
  passReqToCallback: true,
}, passportCallback
));

passport.use('bnet-eu', new BnetStrategy({
  clientID: process.env.BLIZZAPIKEY,
  clientSecret: process.env.BLIZZSECRET,
  scope: 'wow.profile',
  callbackURL: process.env.DEVDOMAIN + '/api/auth/bnet/callback?region=eu',
  region: 'eu',
  passReqToCallback: true,
}, passportCallback 
));

function passportCallback(req, accessToken, refreshToken, profile, done) {
  User.findOne({ 'bnet.id': profile.id }, (err, user) => {
    if (err) {
      return done(err);
    }

    if (user && _.includes(user.bnet.regions, req.query.region)) {
      user.jwt = user.generateJwt();
      user.isNewUser = false;
      user.newChars = false;
      return done(null, user);
    } else {
      axios({
        method: 'get',
        url: 'https://' + req.query.region + '.api.battle.net/wow/user/characters',
        headers: { 'Authorization': 'Bearer ' + accessToken }
      })
        .then(response => {
          const personalChars = [];
          if (response.data.characters.length > 0) {
            response.data.characters.map((character) => {
              personalChars.push({ 
                name: character.name,
                realm: character.realm,
                region: req.query.region,
                thumbnail: character.thumbnail,
                guild: character.guild,
                guildRealm: character.guildRealm,
                lastModified: character.lastModified
              });
            });
          }
          
          let savingUser = {};
          if (user) {
            savingUser = user;
            savingUser.bnet.regions.push(req.query.region);
            savingUser.personalCharacters = _.concat(personalChars);
          } else {
            const regions = [];
            regions.push(req.query.region);
            savingUser = new User({
              bnet: {
                id: profile.id,
                battletag: profile.battletag,
                regions: regions,
                personalCharacters: personalChars,
              }
            });
          }

          savingUser.save((err, savedUser) => {
            if (err) {
              return done(err);
            }
  
            savedUser.jwt = savedUser.generateJwt();
            savedUser.isNewUser = false;
            savedUser.newChars = true;
            return done(null, savedUser);
          });
        })
        .catch(error => {
          console.log('error with axios in passport.js', error);
          return done(constants.errMsg);
        });
      }
    });
  }