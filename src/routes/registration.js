const express = require('express');
const router = express.Router();
const webauthn = require('../webauthn');
const User = require('../models/User');

// Endpoint to get registration page
router.get('/register', async (req, res) => {
    res.render('register');
});

// Endpoint to handle registration form submission
router.post('/register', async (req, res) => {
    try {
        const user = new User({ /* user details from req.body */ });
        await user.save();

        // Convert user ID to byte array
        const userId = Array.from(Buffer.from(user._id.toString(), 'hex'));

        const options = await webauthn.getRegistrationOptions({ id: userId, /* other user details */ });
        res.json(options);
        res.json({ success: true, message: "Registration successful" });
    } catch (error) {
        // If an error occurs
        res.status(500).json({ success: false, message: "Error during registration" });
    }
});


module.exports = router;
