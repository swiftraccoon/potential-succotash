const express = require('express');
const router = express.Router();
const webauthn = require('../webauthn');

router.get('/login', (req, res) => {
    const user = /* your logic to get user details */;
    const options = webauthn.getAuthenticationOptions(user.id);
    res.json(options);
});

router.post('/login', async (req, res) => {
    const user = /* your logic to get user details */;
    const result = await webauthn.verifyAuthentication(user.id, req.body);
    if (result) {
        // TODO: Set up user session
        res.send('Login successful');
    } else {
        res.status(400).send('Login failed');
    }
});


module.exports = router;
