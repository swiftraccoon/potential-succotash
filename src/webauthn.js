const { generateRegistrationOptions, generateAuthenticationOptions, verifyRegistrationResponse, verifyAuthenticationResponse } = require('@simplewebauthn/server');
const User = require('./models/User');

const rpID = 'localhost:3002'; // Replace with your domain
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
    });

    return options;
}

async function verifyRegistration(user, response, storedChallenge) {
    try {
        const verification = await verifyRegistrationResponse({
            response: response,
            expectedChallenge: storedChallenge,
            expectedOrigin: `https://${rpID}`,
            expectedRPID: rpID,
        });

        // console.log("webauthn/verifyRegistration/verification: ", verification);

        if (verification.verified) {
            // Convert Uint8Array to Buffer
            const credentialIDBuffer = Buffer.from(verification.registrationInfo.credentialID);
            const credentialPublicKeyBuffer = Buffer.from(verification.registrationInfo.credentialPublicKey);

            user.authenticators.push({
                credentialID: credentialIDBuffer,
                credentialPublicKey: credentialPublicKeyBuffer,
                counter: verification.registrationInfo.counter,
            });
            await user.save();
        }

        return verification.verified;
    } catch (error) {
        console.error("Error in verifyRegistration:", error);
        return false;
    }
}

// Function to get authentication options
async function getAuthenticationOptions(userId) {
    const user = await User.findById(userId);
    const authenticators = user.authenticators.map(auth => ({
        credentialID: auth.credentialID,
    }));

    const options = generateAuthenticationOptions({
        allowCredentials: authenticators,
        userVerification: 'preferred',
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
        },
        expectedChallenge: '',
        expectedOrigin: `https://${rpID}`,
        expectedRPID: rpID,
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
