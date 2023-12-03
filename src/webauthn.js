const {
  generateRegistrationOptions,
  generateAuthenticationOptions,
  verifyRegistrationResponse,
  verifyAuthenticationResponse,
} = require("@simplewebauthn/server");
const User = require("./models/User");
const { Binary } = require("mongodb");

const rpID = "localhost"; // Replace with your domain
const rpName = "Localhost Dev"; // Replace with your organization name

async function getRegistrationOptions({ user, authenticatorSelection }) {
  console.log("webauthn/getRegistrationOptions/user:", user);
  console.log(
    "webauthn/getRegistrationOptions/authenticatorSelection:",
    authenticatorSelection
  );
  const options = generateRegistrationOptions({
    rpName: rpName,
    rpID: rpID,
    userID: user._id.toString(),
    userName: user.email,
    userDisplayName: `${user.firstName} ${user.lastName}`, // Add user's display name
    authenticatorSelection: authenticatorSelection,
    attestation: "direct", // or 'indirect', 'none'
    excludeCredentials: user.authenticators.map((auth) => ({
      id: auth.credentialID,
      type: "public-key",
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
      const credentialIDBuffer = Buffer.from(
        verification.registrationInfo.credentialID
      );
      const credentialPublicKeyBuffer = Buffer.from(
        verification.registrationInfo.credentialPublicKey
      );

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
  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: user.authenticators.map((auth) => ({
      id: auth.credentialID,
      type: "public-key",
      transports: ["internal"],
    })),
    userVerification: "preferred",
  });
  console.log(
    "webauthn/getAuthenticationOptions/options.challenge:",
    options.challenge
  );
  // Store the challenge in the database
  user.currentChallenge = options.challenge;
  console.log(
    "webauthn/getAuthenticationOptions/user.currentChallenge:",
    user.currentChallenge
  );
  try {
    await user.save();
  } catch (error) {
    console.error(
      "webauthn/getAuthenticationOptions Error saving user:",
      error
    );
    console.error("webauthn/getAuthenticationOptions user:", user);
  }

  return options;
}

// Function to verify authentication
async function verifyAuthentication(userId, response) {
  const user = await User.findById(userId);
  console.log("webauthn/verifyAuthentication/user:", user);
  // Retrieve the stored challenge from the database
  const storedChallenge = user.currentChallenge;
  console.log(
    "webauthn/verifyAuthentication/storedChallenge:",
    storedChallenge
  );
  console.log("webauthn/verifyAuthentication/response:", response);
  let responseIdBase64 = response.id.replace(/-/g, "+").replace(/_/g, "/");
  let responseIdBinary = Binary.createFromBase64(responseIdBase64, 0);
  let expectedAuthenticator = await user.authenticators.find((auth) =>
    auth.credentialID.equals(responseIdBinary)
  );
  if (!expectedAuthenticator) {
    throw new Error(
      `Could not find authenticator for response ID${response.id} for auth ID ${auth.credentialID}`
    );
  }
  console.log(
    "webauthn/verifyAuthentication/expectedAuthenticator:",
    expectedAuthenticator
  );
  console.log("webauthn/verifyAuthentication/response.id:", response.id);
  console.log(
    "webauthn/verifyAuthentication/user.authenticators:",
    user.authenticators
  );
  user.authenticators.forEach((auth) => {
    console.log(
      "webauthn/verifyAuthentication/auth.credentialID:",
      auth.credentialID
    );
    console.log(
      "webauthn/verifyAuthentication/auth.credentialID.equals(response.id):",
      auth.credentialID.equals(response.id)
    );
  });
  const verification = await verifyAuthenticationResponse({
    response: response,
    expectedChallenge: storedChallenge,
    expectedOrigin: `https://${rpID}`,
    expectedRPID: rpID,
    expectedAuthenticator,
  });
  console.log("webauthn/verifyAuthentication/verification:", verification);

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
