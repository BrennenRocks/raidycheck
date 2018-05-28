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
  region: 'us'
}, function (accessToken, refreshToken, profile, done) {
  User.findOne({ 'bnet.id': profile.id, 'bnet.region': 'us' }, (err, user) => {
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
      url: 'https://us.api.battle.net/wow/user/characters',
      headers: { 'Authorization': 'Bearer ' + accessToken }
    })
      .then(response => {
        const personalCharacters = [];
        if (response.data.characters) {
          response.data.characters.map((character) => {
            personalCharacters.push({ name: character.name, realm: character.realm });
          });
        }

        new User({
          bnet: {
            id: profile.id,
            battletag: profile.battletag,
            region: 'us',
            personalCharacters: personalCharacters,
          }
        }).save((err, savedUser) => {
          if (err) {
            return done(err);
          }

          savedUser.jwt = savedUser.generateJwt;
          savedUser.isNewUser = true;
          return done(null, savedUser);
        });
      })
      .catch(error => {
        console.log(error);
        return done('Error with Axios get User characters');
      });
  });
}));

passport.use('bnet-eu', new BnetStrategy({
  clientID: process.env.BLIZZAPIKEY,
  clientSecret: process.env.BLIZZSECRET,
  scope: 'wow.profile',
  callbackURL: process.env.DEVDOMAIN + '/api/auth/bnet/callback?region=eu',
  region: 'eu'
}, function (accessToken, refreshToken, profile, done) {
  User.findOne({ 'bnet.id': profile.id, 'bnet.region': 'eu' }, (err, user) => {
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
      url: 'https://eu.api.battle.net/wow/user/characters',
      headers: { 'Authorization': 'Bearer ' + accessToken }
    })
      .then(response => {
        const personalCharacters = [];
        if (response.data.characters) {
          response.data.characters.map((character) => {
            personalCharacters.push({ name: character.name, realm: character.realm });
          });
        }

        new User({
          bnet: {
            id: profile.id,
            battletag: profile.battletag,
            region: 'eu',
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
}));