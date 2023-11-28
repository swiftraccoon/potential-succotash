const express = require('express');
const router = express.Router();
const webauthn = require('../webauthn');
const User = require('../models/User');

// Endpoint to get authentication options
router.get('/login', async (req, res) => {
    res.render('login');
    const user = await User.findOne({ /* criteria to find the user */ });
    if (!user) {
        return res.status(404).send('User not found');
    }
    const options = await webauthn.getAuthenticationOptions(user.id);
    res.json(options);
});

// Endpoint to verify authentication
router.post('/login', async (req, res) => {
    const user = await User.findOne({ /* criteria to find the user */ });
    if (!user) {
        return res.status(404).send('User not found');
    }
    const result = await webauthn.verifyAuthentication(user.id, req.body);
    if (result) {
        // Set up user session
        res.send('Login successful');
    } else {
        res.status(400).send('Login failed');
    }
});

module.exports = router;
