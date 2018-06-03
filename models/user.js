const mongoose = require('mongoose'),
  jwt = require('jsonwebtoken');

const config = require('../config/database');

const Schema = mongoose.Schema;

mongoose.Promise = global.Promise;
const userSchema = new Schema({
  bnet: {
    id: { type: Number, required: true },
    battletag: { type: String, lowercase: true, required: true },
    regions: [String],
    personalCharacters: [
      {
        name: { type: String, required: true },
        realm: { type: String, required: true },
        region: { type: String, required: true },
        thumbnail: { type: String },
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
  return jwt.sign({ id: this._id, bnet: { id: this.bnet.id, battletag: this.bnet.battletag, region: this.bnet.region } }, config.secret, { expiresIn: '30d' });
}

module.exports = mongoose.model('User', userSchema);