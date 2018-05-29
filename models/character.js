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
  class: { type: Number },
  thumbnail: { type: String },
  lastUpdated: { type: Date, default: Date.now() },
  items: [
    {
      slot: { type: String },
      id: { type: Number },
      name: { type: String },
      icon: { type: String },
      iLvl: { type: Number },
      quality: { type: Number },
      bonusLists: [Number],
      tooltipParams: { type: Object },
    }
  ],
});

module.exports = mongoose.model('Character', characterSchema);