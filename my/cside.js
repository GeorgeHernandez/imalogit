/* global fetch */
/**
 * cside module. Client-side code for dealing with session, API Gateway calls, etc.
 * Process:
 * -1. User signs in & gets a code in the querystring.
 * -2. Send code to the TOKEN endpoint to get tokens & user meta.
 * -3. Put the tokens & user name in localStorage.
 * -4. With each API Gateway call:
 *     - Send refresh token to the TOKEN endpoint to get fresh tokens.
 *     - Use the fresh tokens.
 * @module my/csession
 */
// const AmazonCognitoIdentity = require('amazon-cognito-identity-js')
const base64url = require('base64url')
const jtp = require('jwk-to-pem')
const jwt = require('jsonwebtoken')
global.fetch = require('node-fetch')
const cfg = require('./config')

/**
 * Make URI encoded query string out of a simple object.
 * @param {object} data One level deep. E.g. {a:b, c:d}, not {a:{b:c, d:e}, f:g}
 * @returns {string} A URI encoded query string. E.g. a%3Db%26c%3Dd, i.e. a=b&c=d
 */
function encodeForURI (data) {
  const body = Object.keys(data)
    .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
    .join('&')
  // console.log('body:' + body)
  return body
}

/**
 * POST to the Cognito Token endpoint to get tokens.
 * Usually id & access tokens are good for 1 hour, but refresh tokens are good for 30 days.
 * @param {string} url The url for the Cognito TOKEN endpoint
 * @param {string} data Data required by the endpoint
 * @returns {object} An obect with id_token, access_token, expires_in, token_type
 * Also has refresh_token if grant type was authorization_code.
 */
async function postEncodedToEndpoint (url = '', body = '') {
  const response = await fetch(url, {
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    // mode: 'cors', // no-cors, *cors, same-origin
    // cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    // credentials: 'same-origin', // include, *same-origin, omit
    headers: {
      // 'Content-Type': 'application/json'
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    // redirect: 'follow', // manual, *follow, error
    // referrerPolicy: 'no-referrer', // no-referrer, *client
    body: body // body data type must match "Content-Type" header
  })
  // console.log('response: ' + response)
  const answer = await response.json() // Parse response into a native JavaScript object
  // console.log('answer: ' + answer)
  return answer
}

/**
 * Verify a JWT & return object with claims.
 * https://docs.aws.amazon.com/en_pv/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-verifying-a-jwt.html
 * @param {string} idToken JWT for the id_token
 * @returns {object} The key properties are claims & isValid. The other properties are for debugging.
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

/**
 * This method assumes the user just signed in via authorization code grant &
 * got a code in the querystring.
 * @returns {string} The authorization code.
 */
var readAuthorizationCode = exports.readAuthorizationCode = () => {
  const queryParams = new URLSearchParams(window.location.search)
  const code = queryParams.get('code')
  // console.log('code: ' + code)
  return code
}

/**
 * Exchange the code for tokens by POSTing the code to the TOKEN endpoint.
 * @param {string} authorizationCode The authorization code returned by Cognito after sign in
 * @returns {object} An object with properties for tokens & claims.
 */
var exchangeCode = exports.exchangeCode = async (authorizationCode) => {
  const data = {
    grant_type: 'authorization_code',
    client_id: cfg.clientId,
    redirect_uri: cfg.urlSignedIn,
    code: authorizationCode
  }
  const body = encodeForURI(data)
  // console.log('body:' + body)
  // return body
  const tokens = await postEncodedToEndpoint(cfg.urlAuthToken, body)
  const idTokenContent = await validateToken(tokens.id_token)
  const session = {}
  session.tokens = tokens
  session.claims = idTokenContent.claims
  return session
}

exports.getRefreshToken = async () => {
  let refreshToken = window.localStorage.getItem('refreshToken')
  if (!refreshToken) {
    const authorizationCode = readAuthorizationCode()
    const session = await exchangeCode(authorizationCode)
    refreshToken = session.tokens.refresh_token
    window.localStorage.setItem('refreshToken', refreshToken)
    window.localStorage.setItem('idToken', session.tokens.id_token)
    window.localStorage.setItem('userName', session.claims['cognito:username'])
  }
  return refreshToken
}

/**
 * Exchange the code for tokens by POSTing the refresh token to the TOKEN endpoint.
 * Usually id & access tokens are good for 1 hour, but refresh tokens are good for 30 days.
 * Tokens should be refreshed before each call to the API Gateway.
 * @param {string} refreshToken From Cognito. Usually good for 30 days.
 * @returns {object} An object with .tokens + .claims (for convenience).
 */
async function exchangeRefreshToken (refreshToken) {
  const data = {
    grant_type: 'refresh_token',
    client_id: cfg.clientId,
    refresh_token: refreshToken
  }
  const body = encodeForURI(data)
  const tokens = await postEncodedToEndpoint(cfg.urlAuthToken, body)
  const idTokenContent = await validateToken(tokens.id_token)
  const response = {}
  response.tokens = tokens
  response.claims = idTokenContent.claims
  return response
}

/**
 * Scrap method for DEV ONLY.
 * @param {string} x Use as needed
 */
exports.foo = async (x = '') => {
  return exchangeRefreshToken(x)
}

/**
 * NOT related to sessions. I'm just parking this here.
 * @param {string} api
 * @param {string} origin
 * @param {string} authorization
 * @todo implement in another module?
 * @returns
 *   Probably JSON data.
 *   Side-effect: Updates localStorage for tokens.
 */
exports.heyAPIGateway = async (resource) => {
  const localKeyRoot = 'CognitoIdentityServiceProvider.' + cfg.clientId
  const userName = window.localStorage.getItem(localKeyRoot + '.LastAuthUser')
  let refreshToken
  if (userName) {
    refreshToken = window.localStorage.getItem(localKeyRoot + '.' + userName + '.refreshToken')
    if (!refreshToken) throw new Error('bad refresh token')
  } else {
    throw new Error('bad user name')
  }
  const freshData = await exchangeRefreshToken(refreshToken)
  refreshToken = freshData.tokens.refresh_token
  console.log('refreshToken: ' + refreshToken)
  const idToken = freshData.tokens.id_token
  console.log('idToken: ' + idToken)
  window.localStorage.setItem(localKeyRoot + '.' + userName + '.refreshToken', refreshToken)
  window.localStorage.setItem(localKeyRoot + '.' + userName + '.idToken', idToken)
  console.log('urlApi + resource: ' + cfg.urlApi + resource)
  const response = await fetch(cfg.urlApi + resource, {
    headers: {
      Origin: cfg.urlOrigin,
      Authorization: 'Bearer ' + idToken
    },
    method: 'GET'
  })
  const data = await response.json()
  // console.log('data: ', data)
  return data
}
