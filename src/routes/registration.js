const express = require('express');
const router = express.Router();
const webauthn = require('../webauthn');
const User = require('../models/User');
const session = require('express-session');

// Endpoint to get registration page
router.get('/register', async (req, res) => {
    res.render('register');
});

router.post('/register', async (req, res) => {
    try {
        const { firstname, lastname, email } = req.body;
        const user = new User({
            firstName: firstname,
            lastName: lastname,
            email: email,
        });
        await user.save();
        // console.log("registration/register/user:", user)

        const options = await webauthn.getRegistrationOptions(user);
        // console.log("registration/register/options:", options)
        // Store the challenge in the session
        req.session.challenge = options.challenge;
        res.json(options);
    } catch (error) {
        res.status(500).json({ success: false, message: "Error during registration", error: error.message });
    }
});

router.post('/register/response', async (req, res) => {
    try {
        const { email, response } = req.body;
        let user = await User.findOne({ email: email });
        if (!user) {
            user = new User({ email: email, firstName: req.body.firstName, lastName: req.body.lastName });
        }
        // console.log("registration/register/response/user:", user)
        // console.log("registration/register/response/email:", email)
        // console.log("registration/register/response/response:", response)

        // Retrieve the stored challenge
        const storedChallenge = req.session.challenge;

        const verification = await webauthn.verifyRegistration(user, response, storedChallenge);
        // console.log("registration/register/response/verification:", await verification)
        if (verification) {
            res.json({ success: true, message: "Registration successful" });
        } else {
            res.status(400).json({ success: false, message: "Registration failed" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: "Error during registration", error: error.message });
    }
});

module.exports = router;
