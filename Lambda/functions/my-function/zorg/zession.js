const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
const AWS = require('aws-sdk');
const base64url = require('base64url');
const CognitoUserPool = AmazonCognitoIdentity.CognitoUserPool;
const fetch = require('node-fetch');
// global.fetch = require('node-fetch');
const jtp = require('jwk-to-pem');
const jwt = require('jsonwebtoken');
const request = require('request');

const body = {isValid: true};

async function validateToken(token) {
    // Verifying a JSON Web Token (https://docs.aws.amazon.com/en_pv/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-verifying-a-jwt.html)

    // Each step must be true before proceeding and  all steps must be true.

    // Step 1: Confirm the Structure of the JWT
    const JWS_REGEX = /^[A-z0-9\-_=]+?\.[A-z0-9\-_=]+?\.[A-z0-9\-_=]+?$/; // E.g. aB1-_=.cD2-_=.eF3-_=
    if (JWS_REGEX.test(token)) {
        body.goodStructure = true;
    } else {
        body.goodStructure = false;
        body.isValid = false;
    }

    // Step 2: Validate the JWT Signature
    // Step 2.1: Decode the local Key ID (kid) from the token
    const headerString = base64url.decode(token.split('.')[0]);
    const header = JSON.parse(headerString);
    const kid = header.kid;
    body.kid = kid;

    // Step 2.2: Compare the local kid to the pulic kid.
    const region = process.env.AWS_REGION;
    const userPoolId =  process.env.COGNITO_USER_POOL_ID;
    const userPoolUrl = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
    const keysUrl = userPoolUrl + '/.well-known/jwks.json';
    const publicJwksResponse = await fetch(keysUrl);
    const publicJwks = await publicJwksResponse.json();
    body.publicJwks = publicJwks;
    if (kid === publicJwks.keys[0].kid) {
        body.goodKid = true;
        body.keyIndex = 0;
    } else if (kid === publicJwks.keys[1].kid) {
        body.goodKid = true;
        body.keyIndex = 1;
    } else {
        body.goodKid = false;
        body.isValid = false;
    }

    // Step 2.3: Use key to verify the signature.
    var pem = jtp(publicJwks.keys[body.keyIndex]);
    body.pem = pem;
    try {
        var claims = jwt.verify(token, pem); // TODO: Handle err.
        body.goodSignature = claims;
    } catch(error) {
        body.goodSignature = error;
        body.isValid = false;
    }

    // Step 3: Verify the Claims
    // Step 3.1: Verify that the token is not expired.
    const expirationTime = claims.exp; // seconds since 1970-01-01 0:0:0Z
    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime < expirationTime) {
        body.goodTime = true;
    } else {
        body.goodTime = false;
        body.isValid = false;
    }

    // Step 3.2: Verify that the aud claim matches the app client ID in the Cognito user pool.
    const appClientId = process.env.COGNITO_CLIENT_ID;
    if (claims.aud === appClientId) {
        body.goodAppId = true;
    } else {
        body.goodAppId = false;
        body.isValid = false;
    }

    // Step 3.3: Verify that the iss claim matches the Cognito user pool.
    if (claims.iss === userPoolUrl) {
        body.goodIssuer = true;
    } else {
        body.goodIssuer = false;
        body.isValid = false;
    }

    // Step 3.4: Verify the token_use claim.
    // In our case it is `id` instead of `access`
    body.goodUse = (claims.token_use === 'id');
    if (claims.token_use === 'id') {
        body.goodUse = true;
    } else {
        body.goodUse = false;
        body.isValid = false;
    }

    // TODO: Call refreshToken()

    return body;
}
exports.validateToken = validateToken;
