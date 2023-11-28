const { generateRegistrationOptions, generateAuthenticationOptions, verifyRegistrationResponse, verifyAuthenticationResponse } = require('@simplewebauthn/server');
const User = require('./models/User');

const rpID = 'example.com'; // Replace with your domain
const rpName = 'Example Co'; // Replace with your organization name

// Function to get registration options
async function getRegistrationOptions(userId) {
    const user = await User.findById(userId);
    const options = generateRegistrationOptions({
        rpName,
        rpID,
        userID: user._id.toString(),
        userName: user.username,
        // Add other necessary options
    });
    return options;
}

// Function to verify registration
async function verifyRegistration(userId, response) {
    const user = await User.findById(userId);
    const verification = verifyRegistrationResponse({
        credential: response,
        expectedChallenge: '',
        expectedOrigin: `https://${rpID}`,
        expectedRPID: rpID,
        // Add other necessary verification parameters
    });

    if (verification.verified) {
        user.authenticators.push({
            credentialID: verification.registrationInfo.credentialID,
            credentialPublicKey: verification.registrationInfo.credentialPublicKey,
            counter: verification.registrationInfo.counter,
        });
        await user.save();
    }

    return verification.verified;
}

// Function to get authentication options
async function getAuthenticationOptions(userId) {
    const user = await User.findById(userId);
    const authenticators = user.authenticators.map(auth => ({
        credentialID: auth.credentialID,
        // Add other necessary fields
    }));

    const options = generateAuthenticationOptions({
        allowCredentials: authenticators,
        userVerification: 'preferred',
        // Add other necessary options
    });

    return options;
}

// Function to verify authentication
async function verifyAuthentication(userId, response) {
    const user = await User.findById(userId);
    const expectedAuthenticator = user.authenticators.find(auth => auth.credentialID.equals(response.rawId));

    if (!expectedAuthenticator) {
        throw new Error('Authenticator not found');
    }

    const verification = verifyAuthenticationResponse({
        credential: response,
        expectedAuthenticator: {
            credentialPublicKey: expectedAuthenticator.credentialPublicKey,
            counter: expectedAuthenticator.counter,
            // Add other necessary fields
        },
        expectedChallenge: '',
        expectedOrigin: `https://${rpID}`,
        expectedRPID: rpID,
        // Add other necessary verification parameters
    });

    if (verification.verified) {
        expectedAuthenticator.counter = verification.authenticationInfo.newCounter;
        await user.save();
    }

    return verification.verified;
}

module.exports = {
    getRegistrationOptions,
    verifyRegistration,
    getAuthenticationOptions,
    verifyAuthentication,
};
