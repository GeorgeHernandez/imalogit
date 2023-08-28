const base64url = require('base64url')
const fetch = require('node-fetch')
// global.fetch = require('node-fetch');
const jtp = require('jwk-to-pem')
const jwt = require('jsonwebtoken')
const cfg = require('./config')

/**
 * Verify a JWT & return object with claims.
 * https://docs.aws.amazon.com/en_pv/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-verifying-a-jwt.html
 * @param {string} idToken JWT for the id_token
 * @returns {object} The key property is .claims. The other properties are for debugging.
 */
async function validateToken (idToken) {
  // Each step must be true before proceeding and all steps must be true.

  const body = {}
  // Step 1: Confirm the Structure of the JWT
  const JWS_REGEX = /^[A-z0-9\-_=]+?\.[A-z0-9\-_=]+?\.[A-z0-9\-_=]+?$/ // E.g. aB1-_=.cD2-_=.eF3-_=
  if (JWS_REGEX.test(idToken)) {
    body.goodStructure = true
  } else {
    throw new Error('bad structure')
  }

  // Step 2: Validate the JWT Signature
  // Step 2.1: Decode the local Key ID (kid) from the token
  const headerString = base64url.decode(idToken.split('.')[0])
  const header = JSON.parse(headerString)
  const kid = header.kid
  body.kid = kid

  // Step 2.2: Compare the local kid to the pulic kid.
  const userPoolUrl = `https://cognito-idp.${cfg.poolRegion}.amazonaws.com/${cfg.poolId}`
  const keysUrl = userPoolUrl + '/.well-known/jwks.json'
  const publicJwksResponse = await fetch(keysUrl)
  const publicJwks = await publicJwksResponse.json()
  body.publicJwks = publicJwks
  if (kid === publicJwks.keys[0].kid) {
    body.goodKid = true
    body.keyIndex = 0
  } else if (kid === publicJwks.keys[1].kid) {
    body.goodKid = true
    body.keyIndex = 1
  } else {
    throw new Error('bad key id')
  }

  // Step 2.3: Use key to verify the signature.
  const pem = jtp(publicJwks.keys[body.keyIndex])
  body.pem = pem
  const claims = jwt.verify(idToken, pem)
  if (claims) {
    body.claims = claims
  } else {
    throw new Error('bad signature')
  }

  // Step 3: Verify the Claims
  // Step 3.1: Verify that the token is not expired.
  const expirationTime = claims.exp // seconds since 1970-01-01 0:0:0Z
  const currentTime = Math.floor(Date.now() / 1000)
  if (currentTime < expirationTime) {
    body.goodTime = true
  } else {
    throw new Error('token expired')
  }

  // Step 3.2: Verify that the aud claim matches the app client ID in the Cognito user pool.
  if (claims.aud === cfg.clientId) {
    body.goodAppId = true
  } else {
    throw new Error('bad app id')
  }

  // Step 3.3: Verify that the iss claim matches the Cognito user pool.
  if (claims.iss === userPoolUrl) {
    body.goodIssuer = true
  } else {
    throw new Error('bad issuer')
  }

  // Step 3.4: Verify the token_use claim.
  // In our case it is `id` instead of `access`
  body.goodUse = (claims.token_use === 'id')
  if (claims.token_use === 'id') {
    body.goodUse = true
  } else {
    throw new Error('bad token use')
  }
  return body
}
exports.validateToken = validateToken
