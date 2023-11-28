const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  regex: String,
  email: String,
  isActive: Boolean,
  // Add other necessary fields
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
