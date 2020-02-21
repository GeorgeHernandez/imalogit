// const csession = require('../../my/csession')
const bearerType = 'id_token' // set to what is received after sign in: id_token, access_token, or code

// The user should have signed in with Cognito.
const hashParams = new URLSearchParams(window.location.hash.substr(1))
const idToken = hashParams.get('id_token')
// console.log('id_token: ' + id_token);

const accessToken = hashParams.get('access_token')
// console.log('access_token: ' + access_token);

const queryParams = new URLSearchParams(window.location.search)
const code = queryParams.get('code')
console.log('code: ' + code)

// Set up:
let bearerValue
if (bearerType === 'id_token') {
  bearerValue = idToken
} else if (bearerType === 'access_token') {
  bearerValue = accessToken
} else if (bearerType === 'code') {
  bearerValue = code
}
const authorization = 'Bearer ' + bearerValue
