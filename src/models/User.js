const mongoose = require('mongoose');

const authenticatorSchema = new mongoose.Schema({
    credentialID: Buffer,
    credentialPublicKey: Buffer,
    counter: Number,
});

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  username: String,
  email: String,
  authenticators: [authenticatorSchema],
  currentChallenge: String,
});

module.exports = mongoose.model('User', userSchema);
