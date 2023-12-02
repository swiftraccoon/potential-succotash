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
    console.log("login/options/email:", email);
    const user = await User.findOne({ email: email });
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }
    console.log("login/options/user:", user);
    const options = {
        allowCredentials: user.authenticators.map(auth => ({
            id: auth.credentialID.toString('base64'), // Convert Buffer to Base64 string
            type: 'public-key',
            transports: ['usb', 'nfc', 'ble', 'internal'] // Adjust based on your requirements
        })),
        timeout: 60000,
        userVerification: 'preferred',
    };
    console.log("login/options/options:", options);
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
    console.log("login/response/email:", email);
    console.log("login/response/response:", response);
    const user = await User.findOne({ email: email });
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }
    console.log("login/response/user:", user);
    const result = await webauthn.verifyAuthentication(user, response);
    console.log("login/response/result:", result);
    if (result.verified) {
        // Set up user session
        res.json({ success: true, message: 'Login successful' });
    } else {
        res.status(400).json({ success: false, message: 'Login failed' });
    }
});

module.exports = router;
