const {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
  } = require('@simplewebauthn/server');
  
  const rpID = 'localhost'; // Replace with your domain in production
  const origin = `https://${rpID}`;
  
  // This should interface with your user database
  const users = {}; // Placeholder for user storage
  
  function getRegistrationOptions(userID) {
    const user = users[userID];
  
    const options = generateRegistrationOptions({
      rpName: 'My NodeJS Website',
      rpID,
      userID: user.id,
      userName: user.username,
      userDisplayName: user.displayName,
      attestationType: 'indirect',
      authenticatorSelection: {
        userVerification: 'preferred',
      },
    });
  
    return options;
  }
  
  async function verifyRegistration(userID, credential) {
    const user = users[userID];
    const expectedChallenge = user.currentChallenge;
  
    try {
      const verification = await verifyRegistrationResponse({
        credential,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
      });
  
      // Add the verified authenticator to the user's account
      user.authenticators.push(verification.registrationInfo);
  
      return true;
    } catch (error) {
      // Handle error
      return false;
    }
  }
  
  function getAuthenticationOptions(userID) {
    const user = users[userID];
  
    const options = generateAuthenticationOptions({
      allowCredentials: user.authenticators.map(authenticator => ({
        id: authenticator.credentialPublicKey,
        type: 'public-key',
        transports: authenticator.transports,
      })),
      userVerification: 'preferred',
      rpID,
    });
  
    return options;
  }
  
  async function verifyAuthentication(userID, credential) {
    const user = users[userID];
    const expectedChallenge = user.currentChallenge;
    const authenticator = user.authenticators.find(
      auth => auth.credentialID === credential.id
    );
  
    try {
      const verification = await verifyAuthenticationResponse({
        credential,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        authenticator,
      });
  
      return verification.verified;
    } catch (error) {
      // Handle error
      return false;
    }
  }
  
  module.exports = {
    getRegistrationOptions,
    verifyRegistration,
    getAuthenticationOptions,
    verifyAuthentication,
  };
  