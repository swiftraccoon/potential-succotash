const mongoose = require('mongoose');

const transcriptionSchema = new mongoose.Schema({
  dateTime: Date,
  talkgroupID: String,
  radioID: String,
  transcriptionText: String,
  // Add other necessary fields
});

module.exports = mongoose.model('Transcription', transcriptionSchema);
