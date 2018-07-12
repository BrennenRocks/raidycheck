const mongoose = require('mongoose');

const Schema = mongoose.Schema;

mongoose.Promise = global.Promise;
let titleLengthChecker = (title) => {
  if (!title) {
    return false;
  }

  if (title.length < 3 || title.length > 20) {
    return false;
  }

  return true;
};

const titleValidators = [
  {
    validator: titleLengthChecker,
    message: 'Title must be at least 3 characters but no more than 20'
  }
];

const groupSchema = new Schema({
  title: { type: String, required: true, validate: titleValidators },
  owner: { type: String, required: true },
  image: { type: String },
  favoritesCount: { type: Number, default: 0 },
  favoritedBy: { type: Array },
  isPublic: { type: Boolean, default: true },
  allowOthersToUpdateCharacters: { type: Boolean, default: false },
  characters: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Character"
    }
  ]
});

module.exports = mongoose.model('Group', groupSchema);