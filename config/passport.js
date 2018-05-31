const passport = require('passport'),
  BnetStrategy = require('passport-bnet').Strategy,
  mongoose = require('mongoose'),
  axios = require('axios');

const User = require('../models/user');

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
  User.findOne({ 'bnet.id': profile.id, 'bnet.region': req.query.region }, (err, user) => {
    if (err) {
      return done(err);
    }

    if (user) {
      user.jwt = user.generateJwt();
      user.isNewUser = false;
      return done(null, user);
    }

    axios({
      method: 'get',
      url: 'https://' + req.query.region + '.api.battle.net/wow/user/characters',
      headers: { 'Authorization': 'Bearer ' + accessToken }
    })
      .then(response => {
        const personalCharacters = [];
        if (response.data.characters) {
          response.data.characters.map((character) => {
            personalCharacters.push({ name: character.name, realm: character.realm, thumbnail: character.thumbnail });
          });
        }

        new User({
          bnet: {
            id: profile.id,
            battletag: profile.battletag,
            region: req.query.region,
            personalCharacters: personalCharacters,
          }
        }).save((err, savedUser) => {
          if (err) {
            return done(err);
          }

          savedUser.jwt = savedUser.generateJwt();
          savedUser.isNewUser = true;
          return done(null, savedUser);
        });
      })
      .catch(error => {
        console.log(error);
        return done('Error with Axios get User characters');
      });
  });
}