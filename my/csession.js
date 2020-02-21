/* global fetch */
const AmazonCognitoIdentity = require('amazon-cognito-identity-js')
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
const poolData = { UserPoolId: poolId, ClientId: clientId }
const urlSignedIn = exports.urlSignedIn = 'https://imalogit.com/app/index.html'
const urlSignedOut = exports.urlSignedOut = 'https://imalogit.com/app/signOut.html'
const urlAuthToken = exports.urlAuthToken = 'https://auth.imalogit.com/oauth2/token'
const urlApi = exports.urlApi = 'https://api.imalogit.com/main/dev/'
const urlOrigin = exports.urlOrigin = 'https://imalogit.com'

// const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData)

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
 * @returns {object} An ojbect with id_token, access_token, refresh_token, expires_in, token_type
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
    console.log('err:' + err)
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
exports.refreshTokens = (refreshTokenRaw) => {
  const refreshToken = new AmazonCognitoIdentity.CognitoRefreshToken({ refreshTokenRaw })
  const pool = new AmazonCognitoIdentity.CognitoUserPool(poolData)
  const userData = {
    Username: 'sample@gmail.com',
    Pool: pool
  }

  const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData)

  cognitoUser.refreshSession(refreshToken, (err, session) => {
    if (err) {
      console.log(err)
    } else {
      const retObj = {
        access_token: session.accessToken.jwtToken,
        id_token: session.idToken.jwtToken,
        refresh_token: session.refreshToken.token
      }
      console.log(retObj)
    }
  })
}

/**
 * NOT related to sessions. I'm just parking this here.
 * @param {string} api
 * @param {string} origin
 * @param {string} authorization
 * @todo implement in another module?
 */
async function heyAPIGateway (api, origin, authorization) {
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
};
