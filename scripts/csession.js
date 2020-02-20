/* global fetch */
/**
 * csession module. Client-side sessions.
 * @module csession
*/

/**
 * @todo Move these to config file?
 */
const _poolRegion = 'us-east-1'
const _userPoolId = 'us-east-1_tKSjw3xXu'
const _clientId = '1aosnlgh8roam75comsp77fhd1'
const _urlSignedIn = 'https://imalogit.com/app/index.html'
const _urlSignedOut = 'https://imalogit.com/app/signOut.html'
const _urlAuthToken = 'https://auth.imalogit.com/oauth2/token'
const _urlApi = 'https://api.imalogit.com/main/dev/'
const _urlOrigin = 'https://imalogit.com'

/**
 * Make URI encoded query string out of a simple object.
 * @param {object} data One level deep. E.g. {a:b, c:d}, not {a:{b:c, d:e}, f:g}
 */
const encodeDataForAuthToken = (data) => Object.keys(data)
  .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
  .join('&')

/**
 * POST to the Cognito Token endpoint to get tokens
 * @param {string} url The url for the Cognito Token endpoint
 * @param {string} data Data required by the endpoint
 */
async function postToAuthToken (url = '', data = '') {
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
    body: data // body data type must match "Content-Type" header
  })
  return response.json() // parses JSON response into native JavaScript objects
}

/**
 * After sign in, exchange the code for tokens
 * @param {same} code The authorization code returned by Cognito after sign in
 * @todo Finish implementing this function
 */
exports.exchangeCodeForToken = (code) => {
  const data = {
    grant_type: 'authorization_code',
    client_id: _clientId,
    redirect_uri: _urlSignedIn,
    code: code
  }
}
