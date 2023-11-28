const mongoose = require('mongoose');

const authenticatorSchema = new mongoose.Schema({
    credentialID: Buffer,
    credentialPublicKey: Buffer,
    counter: Number,
    // Add other fields as necessary
});

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  username: String,
  email: String,
  authenticators: [authenticatorSchema],
  // Add other necessary fields
});

module.exports = mongoose.model('User', userSchema);
