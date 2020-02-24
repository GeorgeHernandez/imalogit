/* global fetch */
const AmazonCognitoIdentity = require('amazon-cognito-identity-js')
const base64url = require('base64url')
const jtp = require('jwk-to-pem')
const jwt = require('jsonwebtoken')
global.fetch = require('node-fetch')

/**
 * csession module. For dealing with sessions from the client-side.
 * Process:
 * - 1. User signs in & gets a code in the querystring.
 * - 2. Exchange code for tokens by POSTing the code to the TOKEN endpoint.
 * - 3. Before each server call refresh the tokens.
 * @module my/csession
 */

// HARD CODED properties
/** Cognito app client ID */
const clientId = exports.clientId = '1aosnlgh8roam75comsp77fhd1'
const poolRegion = exports.poolRegion = 'us-east-1'
const poolId = exports.poolId = 'us-east-1_tKSjw3xXu'
const poolData = {
  UserPoolId: poolId,
  ClientId: clientId
}
const urlSignedIn = exports.urlSignedIn = 'https://imalogit.com/app/index.html'
// const urlSignedOut = exports.urlSignedOut = 'https://imalogit.com/app/signOut.html'
const urlAuthToken = exports.urlAuthToken = 'https://auth.imalogit.com/oauth2/token'
// const urlApi = exports.urlApi = 'https://api.imalogit.com/main/dev/'
// const urlOrigin = exports.urlOrigin = 'https://imalogit.com'

/**
 * This method assumes the user just signed in
 * via authorization code grant & gots a code in the querystring.
 * @returns {string} The authorization code.
 */
exports.readAuthorizationCode = () => {
  const bearerType = 'code' // set to what is received after sign in: id_token, access_token, or code

  // The user should have signed in with Cognito.
  const hashParams = new URLSearchParams(window.location.hash.substr(1))
  const idToken = hashParams.get('id_token')
  // console.log('id_token: ' + id_token);

  const accessToken = hashParams.get('access_token')
  // console.log('access_token: ' + access_token);

  const queryParams = new URLSearchParams(window.location.search)
  const code = queryParams.get('code')
  // console.log('code: ' + code)

  // Set up:
  let bearerValue
  if (bearerType === 'id_token') {
    bearerValue = idToken
  } else if (bearerType === 'access_token') {
    bearerValue = accessToken
  } else if (bearerType === 'code') {
    bearerValue = code
  }
  // const authorization = 'Bearer ' + bearerValue
  const authorizationCode = bearerValue
  // console.log('authorizationCode: ' + authorizationCode)
  return authorizationCode
}

/**
 * Exchange the code for tokens by POSTing the code to the TOKEN endpoint.
 * @param {string} code The authorization code returned by Cognito after sign in
 * @returns {object} An object with id_token, access_token, refresh_token, expires_in, token_type
 */
exports.exchangeCodeForTokens = async (authorizationCode) => {
  const data = {
    grant_type: 'authorization_code',
    client_id: clientId,
    redirect_uri: urlSignedIn,
    code: authorizationCode
  }
  const body = encodeDataForAuthToken(data)
  // console.log('body:' + body)
  // return body
  return postToAuthToken(urlAuthToken, body)
}

/**
 * Make URI encoded query string out of a simple object.
 * @param {object} data One level deep. E.g. {a:b, c:d}, not {a:{b:c, d:e}, f:g}
 * @returns {string} A URI encoded query string. E.g. a%3Db%26c%3Dd, i.e. a=b&c=d
 */
function encodeDataForAuthToken (data) {
  const body = Object.keys(data)
    .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
    .join('&')
  // console.log('body:' + body)
  return body
}

/**
 * POST to the Cognito Token endpoint to get tokens
 * @param {string} url The url for the Cognito TOKEN endpoint
 * @param {string} data Data required by the endpoint
 * @returns {object} An obect with id_token, access_token, refresh_token, expires_in, token_type
 */
async function postToAuthToken (url = '', body = '') {
  let tokens
  try {
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
    tokens = await response.json() // parses JSON response into native JavaScript objects
  } catch (err) {
    // console.log('err:' + err)
    tokens = err
  }
  return tokens
}

/**
 * Before each server call, refresh the tokens. Assumes the user either:
 * - signed in & exchanged the code for tokens, or
 * - did a previous call to this function & now has a refresh token.
 * @param {string} A refresh_token JWT
 * @returns {object} An obect with id_token, access_token, refresh_token
 * @todo In progress. getUserData() validateJWT(). I
 */
exports.refreshTokens = async (tokens) => {
  // console.log('JSON.stringify(tokens):' + JSON.stringify(tokens))
  // console.log('JSON.stringify(tokens.refresh_token):' + JSON.stringify(tokens.refresh_token))
  const refreshToken = new AmazonCognitoIdentity.CognitoRefreshToken({
    RefreshToken: tokens.refresh_token
  })
  // console.log('JSON.stringify(refreshToken):' + JSON.stringify(refreshToken))
  const pool = new AmazonCognitoIdentity.CognitoUserPool(poolData)

  const tokenMeta = await validateToken(tokens.id_token)
  // console.log('JSON.stringify(tokenMeta): ' + JSON.stringify(tokenMeta))
  const userEmail = tokenMeta.goodSignature.email
  // console.log('userEmail: ' + userEmail)
  const userName = tokenMeta.goodSignature['cognito:username']
  // console.log('userName: ' + userName)
  const userSub = tokenMeta.goodSignature.sub
  // console.log('userSub: ' + userSub)
  const userData = {
    Username: userName,
    Pool: pool
  }

  const answer = await refreshSession(userData, refreshToken)
  answer.userEmail = userEmail
  answer.userName = userName
  answer.userSub = userSub
  return answer
}

function refreshSession (userData, refreshToken) {
  const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData)
  return new Promise((resolve) => {
    cognitoUser.refreshSession(refreshToken, (err, session) => {
      if (err) {
        // console.log(err)
        return err
      } else {
        const retObj = {
          access_token: session.accessToken.jwtToken,
          id_token: session.idToken.jwtToken,
          refresh_token: session.refreshToken.token
        }
        // console.log(retObj)
        resolve(retObj)
      }
    })
  })
}

async function validateToken (idToken) {
  // Verifying a JSON Web Token (https://docs.aws.amazon.com/en_pv/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-verifying-a-jwt.html)
  // Each step must be true before proceeding and all steps must be true.

  const body = {}
  try {
    // Step 1: Confirm the Structure of the JWT
    const JWS_REGEX = /^[A-z0-9\-_=]+?\.[A-z0-9\-_=]+?\.[A-z0-9\-_=]+?$/ // E.g. aB1-_=.cD2-_=.eF3-_=
    if (JWS_REGEX.test(idToken)) {
      body.goodStructure = true
    } else {
      body.goodStructure = false
      body.isValid = false
      throw new Error('bad structure')
    }

    // Step 2: Validate the JWT Signature
    // Step 2.1: Decode the local Key ID (kid) from the token
    const headerString = base64url.decode(idToken.split('.')[0])
    const header = JSON.parse(headerString)
    const kid = header.kid
    body.kid = kid

    // Step 2.2: Compare the local kid to the pulic kid.
    const userPoolUrl = `https://cognito-idp.${poolRegion}.amazonaws.com/${poolId}`
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
      body.goodKid = false
      body.isValid = false
      throw new Error('bad key i.')
    }

    // Step 2.3: Use key to verify the signature.
    const pem = jtp(publicJwks.keys[body.keyIndex])
    body.pem = pem
    const claims = jwt.verify(idToken, pem)
    if (claims) {
      body.goodSignature = claims
    } else {
      body.goodSignature = {}
      body.isValid = false
      throw new Error('bad signature')
    }

    // Step 3: Verify the Claims
    // Step 3.1: Verify that the token is not expired.
    const expirationTime = claims.exp // seconds since 1970-01-01 0:0:0Z
    const currentTime = Math.floor(Date.now() / 1000)
    if (currentTime < expirationTime) {
      body.goodTime = true
    } else {
      body.goodTime = false
      body.isValid = false
      throw new Error('token expired')
    }

    // Step 3.2: Verify that the aud claim matches the app client ID in the Cognito user pool.
    const appClientId = process.env.COGNITO_CLIENT_ID
    if (claims.aud === appClientId) {
      body.goodAppId = true
    } else {
      body.goodAppId = false
      body.isValid = false
      throw new Error('bad app id')
    }

    // Step 3.3: Verify that the iss claim matches the Cognito user pool.
    if (claims.iss === userPoolUrl) {
      body.goodIssuer = true
    } else {
      body.goodIssuer = false
      body.isValid = false
      throw new Error('bad issuer')
    }

    // Step 3.4: Verify the token_use claim.
    // In our case it is `id` instead of `access`
    body.goodUse = (claims.token_use === 'id')
    if (claims.token_use === 'id') {
      body.goodUse = true
    } else {
      body.goodUse = false
      body.isValid = false
      throw new Error('bad token use')
    }
  } catch (e) {
    body.error = e
    body.isValid = false
  }

  return body
}

/**
 * NOT related to sessions. I'm just parking this here.
 * @param {string} api
 * @param {string} origin
 * @param {string} authorization
 * @todo implement in another module?
 */
exports.heyAPIGateway = async (api, origin, authorization) => {
  try {
    const response = await fetch(api, {
      headers: {
        Origin: origin,
        Authorization: authorization
      },
      method: 'GET'
    })

    const data = await response.json()
    console.log('data: ', data)
    if (data.session.isValid) {
      document.getElementById('asyncAnswer').innerHTML = '<mark>' + data.session.claims.email + '</mark> has signed in.'
    } else {
      throw JSON.stringify(data)
    }
  } catch (e) {
    console.log('Error: ', e)
    document.getElementById('asyncAnswer').innerHTML = 'Sorry, there was an error.'
  }
}
