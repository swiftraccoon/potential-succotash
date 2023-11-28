const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  authenticators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Authenticator' }],
  // Add other necessary fields
});

module.exports = mongoose.model('User', userSchema);
