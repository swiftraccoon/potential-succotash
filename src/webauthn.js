const { generateRegistrationOptions, generateAuthenticationOptions, verifyRegistrationResponse, verifyAuthenticationResponse } = require('@simplewebauthn/server');
const User = require('./models/User');

const rpID = 'localhost'; // Replace with your domain
const rpName = 'Localhost Dev'; // Replace with your organization name

async function getRegistrationOptions(user) {
    const options = generateRegistrationOptions({
        rpName: rpName,
        rpID: rpID,
        userID: user._id.toString(),
        userName: user.email,
        userDisplayName: `${user.firstName} ${user.lastName}`, // Add user's display name
        authenticatorSelection: {
            authenticatorAttachment: 'platform', // or 'cross-platform'
            requireResidentKey: false,
            userVerification: 'preferred' // or 'required', 'discouraged'
        },
        attestation: 'direct', // or 'indirect', 'none'
        excludeCredentials: user.authenticators.map(auth => ({
            id: auth.credentialID,
            type: 'public-key',
            transports: ['usb', 'nfc', 'ble'], // Specify allowed transports
        })),
        // ... other options as needed
    });

    return options;
}

async function verifyRegistration(user, response) {
    const verification = verifyRegistrationResponse({
        response: response,
        expectedChallenge: 'YOUR_STORED_CHALLENGE', // Retrieve the stored challenge
        expectedOrigin: `https://${rpID}`,
        expectedRPID: rpID,
        // ... other necessary verification parameters
    });
    console.log("webauthn/verifyRegistration/verification: ", verification)

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
