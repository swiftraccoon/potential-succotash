const express = require('express');
const router = express.Router();
const webauthn = require('../webauthn');

router.get('/register', (req, res) => {
    // TODO: Retrieve or create user details here
    const user = /* your logic to get user details */;
    const options = webauthn.getRegistrationOptions(user.id);
    res.json(options);
});

router.post('/register', async (req, res) => {
    const user = /* your logic to get user details */;
    const result = await webauthn.verifyRegistration(user.id, req.body);
    if (result) {
        // TODO: Save registration details to the user's account
        res.send('Registration successful');
    } else {
        res.status(400).send('Registration failed');
    }
});


module.exports = router;
