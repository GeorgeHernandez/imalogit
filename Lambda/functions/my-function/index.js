const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
const AWS = require('aws-sdk');
const base64url = require('base64url');
const CognitoUserPool = AmazonCognitoIdentity.CognitoUserPool;
const fetch = require('node-fetch');
// global.fetch = require('node-fetch');
const jtp = require('jwk-to-pem');
const jwt = require('jsonwebtoken');
const request = require('request');
const zession = require('./zorg/zession.js');


exports.handler = async (event) => {
    // Verifying a JSON Web Token (https://docs.aws.amazon.com/en_pv/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-verifying-a-jwt.html)
    const body = {};
    const authorization = event.headers.Authorization; // After authenticated by Cognito.
    const token = authorization.slice(7); // Remove the 'Bearer ' prefix.

    // TODO: Change so that each step must be true before proceeding and that all steps must be true.

    // Step 1: Confirm the Structure of the JWT
    const JWS_REGEX = /^[A-z0-9\-_=]+?\.[A-z0-9\-_=]+?\.[A-z0-9\-_=]+?$/; // E.g. aB1-_=.cD2-_=.eF3-_=
    body.goodStructure = JWS_REGEX.test(token);

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
    }

    // Step 2.3: Use key to verify the signature.
    var pem = jtp(publicJwks.keys[body.keyIndex]);
    body.pem = pem;
    const claims = jwt.verify(token, pem); // TODO: Handle err.
    body.goodSignature = claims;

    // Step 3: Verify the Claims
    // Step 3.1: Verify that the token is not expired.
    const expirationTime = claims.exp; // seconds since 1970-01-01 0:0:0Z
    const currentTime = Math.floor(Date.now() / 1000);
    body.goodTime = (currentTime < expirationTime);

    // Step 3.2: Verify that the aud claim matches the app client ID in the Cognito user pool.
    const appClientId = process.env.COGNITO_CLIENT_ID;
    body.goodAppId = (claims.aud === appClientId);

    // Step 3.3: Verify that the iss claim matches the Cognito user pool.
    body.goodIssuer = (claims.iss === userPoolUrl);

    // Step 3.4: Verify the token_use claim.
    // In our case it is `id` instead of `access`
    body.goodUse = (claims.token_use === 'id');

    // Now do whatever you want with the verified claims!
    body.email = claims.email;
    body.sub = claims.sub; // Subject, i.e. the UUID for the user in the Cognito user pool
    body.foo = zession.foo;
    // console.log("event: ", util.inspect(event, { showHidden: false, depth: null })); // To see input in CloudWatch

    const response = {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': 'https://imalogit.com',
            'Content-Type': 'application/json',
            'gh-test': 'foo'
        },
        body: JSON.stringify(body)
    };
    return response;
};
