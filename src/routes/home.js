const express = require('express');
const router = express.Router();
const Transcription = require('../models/Transcription');

router.get('/', async (req, res) => {
  try {
    const transcriptions = await Transcription.find().sort({ dateTime: -1 }).limit(30);
    res.render('home', { transcriptions });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

module.exports = router;
