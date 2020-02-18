const AmazonCognitoIdentity = require('amazon-cognito-identity-js')
const poolData = {
  UserPoolId: 'us-east-1_tKSjw3xXu',
  ClientId: '1aosnlgh8roam75comsp77fhd1'
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
// console.log('code: ' + code);

// Set up:
const api = 'https://api.imalogit.com/main/dev/'
const origin = 'https://imalogit.com'
const bearerType = 'id_token' // set to either id_token, access_token, or code
let bearerValue
if (bearerType === 'id_token') {
  bearerValue = idToken
} else if (bearerType === 'access_token') {
  bearerValue = accessToken
} else if (bearerType === 'code') {
  bearerValue = code
}
const authorization = 'Bearer ' + bearerValue

async function asyncIt (api, origin, authorization) {
  try {
    const response = await window.fetch(api, {
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
asyncIt(api, origin, authorization)
