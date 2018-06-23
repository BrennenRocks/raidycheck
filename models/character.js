const mongoose = require('mongoose');

const Schema = mongoose.Schema;

mongoose.Promise = global.Promise;

const characterSchema = new Schema({
  cid: {
    name: { type: String, trim: true, required: true },
    realm: { type: String, required: true },
    region: { type: String },
  },
  lastModified: { type: Number},
  iLvl: { type: Number },
  iLvlInBags: { type: Number },
  class: { type: Number },
  thumbnail: { type: String },
  lastUpdated: { type: Date, default: Date.now() },
  items: {
      mainHand: { type: Object, default: {} },
      offHand: { type: Object, default: {} },
      head: { type: Object, default: {} },
      neck: { type: Object, default: {} },
      shoulder: { type: Object, default: {} },
      back: { type: Object, default: {} },
      chest: { type: Object, default: {} },
      wrist: { type: Object, default: {} },
      hands: { type: Object, default: {} },
      waist: { type: Object, default: {} },
      legs: { type: Object, default: {} },
      feet: { type: Object, default: {} },
      finger1: { type: Object, default: {} },
      finger2: { type: Object, default: {} },
      trinket1: { type: Object, default: {} },
      trinket2: { type: Object, default: {} },
    },
});

module.exports = mongoose.model('Character', characterSchema);