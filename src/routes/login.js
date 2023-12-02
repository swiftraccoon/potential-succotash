const express = require('express');
const router = express.Router();
const webauthn = require('../webauthn');
const User = require('../models/User');

// Endpoint to get login page
router.get('/login', async (req, res) => {
    res.render('login');
});

// Endpoint to get authentication options
router.post('/login/options', async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email: email });
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    const options = await webauthn.getAuthenticationOptions(user);
    // Convert credential IDs to a suitable format for the client
    options.allowCredentials = options.allowCredentials.map(cred => ({
        ...cred,
        id: cred.id.toString('base64'), // Convert Buffer to Base64 string
        type: 'public-key'
    }));
    res.json(options);
});

// Endpoint to verify authentication
router.post('/login/response', async (req, res) => {
    const { email, response } = req.body;

    const user = await User.findOne({ email: email });
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    const result = await webauthn.verifyAuthentication(user, response);
    if (result.verified) {
        // Set up user session
        res.json({ success: true, message: 'Login successful' });
    } else {
        res.status(400).json({ success: false, message: 'Login failed' });
    }
});

module.exports = router;
