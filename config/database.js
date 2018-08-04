const crypto = require('crypto').randomBytes(256).toString('hex');

module.exports = {
  uri: process.env.DATABASE || 'mongodb://localhost:27017/raidy_check',
  secret: crypto,
}