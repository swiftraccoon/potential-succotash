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
        console.log(user);
        const options = await webauthn.getRegistrationOptions(user.id);
        res.json(options); // Or handle registration logic here
    } catch (error) {
        res.status(500).send('Error during registration');
    }
});


module.exports = router;
