/* global fetch */
const AmazonCognitoIdentity = require('amazon-cognito-identity-js')
global.fetch = require('node-fetch')

const poolRegion = 'us-east-1'
const userPoolId = 'us-east-1_tKSjw3xXu'
const clientId = '1aosnlgh8roam75comsp77fhd1'
const redirectUri = 'https://imalogit.com/app/index.html'
const api = 'https://api.imalogit.com/main/dev/'
const origin = 'https://imalogit.com'
const bearerType = 'id_token' // set to either id_token, access_token, or code
const poolData = {
  UserPoolId: userPoolId,
  ClientId: clientId
}
const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData)

// The user should have signed in with Cognito.
const hashParams = new URLSearchParams(window.location.hash.substr(1))
const idToken = hashParams.get('id_token')
// console.log('id_token: ' + id_token);

const accessToken = hashParams.get('access_token')
// console.log('access_token: ' + access_token);

const queryParams = new URLSearchParams(window.location.search)
const code = queryParams.get('code')
console.log('code: ' + code);

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
// heyAPIGateway(api, origin, authorization)

function renew () {
  const RefreshToken = new AmazonCognitoIdentity.CognitoRefreshToken({ RefreshToken: 'your_refresh_token_from_a_previous_login' })

  const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData)

  const userData = {
    Username: 'sample@gmail.com',
    Pool: userPool
  }

  const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData)

  cognitoUser.refreshSession(RefreshToken, (err, session) => {
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

const urlForTokens = 'https://auth.imalogit.com/oauth2/token'
const dataForTokens = {
  grant_type: 'authorization_code',
  client_id: clientId,
  redirect_uri: redirectUri,
  code: code
}
const encodedDataForTokens = ((data) => {
  return Object.keys(data)
    .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
    .join('&')
})(dataForTokens)
console.log(encodedDataForTokens)

async function postForTokens (url = '', data = {}) {
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
const responseFromPost = postForTokens(urlForTokens, encodedDataForTokens)
console.log(responseFromPost)
