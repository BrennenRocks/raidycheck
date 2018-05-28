const mongoose = require('mongoose'),
  jwt = require('jsonwebtoken');

const config = require('../config/database');

const Schema = mongoose.Schema;

mongoose.Promise = global.Promise;
const userSchema = new Schema({
  bnet: {
    id: { type: Number, required: true },
    battletag: { type: String, required: true },
    region: { type: String, required: true },
    personalCharacters: [
      {
        name: { type: String, required: true },
        realm: { type: String, required: true },
      }
    ]
  },
  dateSignedUp: { type: Date, default: Date.now() },
  image: { type: String, default: 'https://images.raidycheck.com/defaultUser.png' },
  groups: {
    personal: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
      }
    ],
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
      }
    ],
  },
});

userSchema.methods.generateJwt = function () {
  return jwt.sign({ id: this._id }, config.secret, { expiresIn: '30d' });
}

module.exports = mongoose.model('User', userSchema);