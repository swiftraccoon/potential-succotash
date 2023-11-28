const express = require('express');
const router = express.Router();
const webauthn = require('../webauthn');
const User = require('../models/User');

// Endpoint to get registration options
router.get('/register', async (req, res) => {
    res.render('register');
    const user = new User({ /* user details */ });
    await user.save();
    const options = await webauthn.getRegistrationOptions(user.id);
    res.json(options);
});

// Endpoint to verify registration
router.post('/register', async (req, res) => {
    const user = await User.findOne({ /* criteria to find the user */ });
    if (!user) {
        return res.status(404).send('User not found');
    }
    const result = await webauthn.verifyRegistration(user.id, req.body);
    if (result) {
        res.send('Registration successful');
    } else {
        res.status(400).send('Registration failed');
    }
});

module.exports = router;
