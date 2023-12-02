const { generateRegistrationOptions, generateAuthenticationOptions, verifyRegistrationResponse, verifyAuthenticationResponse } = require('@simplewebauthn/server');
const User = require('./models/User');

const rpID = 'localhost'; // Replace with your domain
const rpName = 'Localhost Dev'; // Replace with your organization name

async function getRegistrationOptions({user, authenticatorSelection}) {
    console.log("webauthn/getRegistrationOptions/user:", user);
    console.log("webauthn/getRegistrationOptions/authenticatorSelection:", authenticatorSelection);
    const options = generateRegistrationOptions({
        rpName: rpName,
        rpID: rpID,
        userID: user._id.toString(),
        userName: user.email,
        userDisplayName: `${user.firstName} ${user.lastName}`, // Add user's display name
        authenticatorSelection: authenticatorSelection,
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
// async function getAuthenticationOptions(userId) {
//     const user = await User.findById(userId);
//     const authenticators = user.authenticators.map(auth => ({
//         credentialID: auth.credentialID,
//     }));

//     const options = generateAuthenticationOptions({
//         allowCredentials: authenticators,
//         userVerification: 'preferred',
//     });

//     return options;
// }

// Function to get authentication options
async function getAuthenticationOptions(userId) {
    const user = await User.findById(userId);
    const options = generateAuthenticationOptions({
        rpID,
        allowCredentials: user.authenticators.map(auth => ({
            id: auth.credentialID,
            type: 'public-key',
            transports: ['internal']
        })),
        userVerification: 'preferred',
    });

    // Store the challenge in the database
    user.currentChallenge = options.challenge;
    await user.save();

    return options;
}

// Function to verify authentication
async function verifyAuthentication(userId, response) {
    const user = await User.findById(userId);
    // Retrieve the stored challenge from the database
    const storedChallenge = user.currentChallenge;

    const verification = verifyAuthenticationResponse({
        response: response,
        expectedChallenge: storedChallenge,
        expectedOrigin: `https://${rpID}`,
        expectedRPID: rpID,
        authenticator: user.authenticators.find(auth => auth.credentialID.equals(response.id)),
    });

    if (verification.verified) {
        expectedAuthenticator.counter = verification.authenticationInfo.newCounter;
        user.currentChallenge = null;
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
