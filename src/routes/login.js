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

    try {
        const options = await webauthn.getAuthenticationOptions(user.id);
        res.json(options);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error generating authentication options', error: error.message });
    }
});

// Endpoint to verify authentication
router.post('/login/response', async (req, res) => {
    const { email, response } = req.body;
    const user = await User.findOne({ email: email });

    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }
    console.log("login/login/response/user:", user)
    try {
        const result = await webauthn.verifyAuthentication(user.id, response);
        console.log("login/login/response/result:", result)
        if (result) {
            // Set up user session or perform other post-login actions
            res.json({ success: true, message: 'Login successful' });
        } else {
            res.status(400).json({ success: false, message: 'Login failed' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error during authentication verification', error: error.message });
    }
});

module.exports = router;
