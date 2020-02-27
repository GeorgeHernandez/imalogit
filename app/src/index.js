;((async () => {
  const cside = require('../../my/cside')

  // Test 1. Read authorization code.
  // const authorizationCode = cside.readAuthorizationCode()
  // // console.log('authorizationCode: ' + authorizationCode)

  // Test 2. Exchange code. Dependencies: Test 1.
  // const responseToCode = await cside.exchangeCode(authorizationCode)
  // console.log('responseToCode: ' + JSON.stringify(responseToCode))

  // Test 3. Get refrsh token.
  const refreshToken = await cside.getRefreshToken()
  console.log('refreshToken: ' + JSON.stringify(refreshToken))
  document.getElementById('mySpan').innerHTML = '<mark>' + window.localStorage.getItem('userName') + '</mark> has signed in.'

  // Test 4. Exchange refresh token.
  // const initalRefreshToken = window.localStorage.getItem('CognitoIdentityServiceProvider.1aosnlgh8roam75comsp77fhd1.' + userName + '.refreshToken')
  // const x = await cside.foo(initalRefreshToken)
  // console.log('x: ' + JSON.stringify(x))

  // const y = cside.heyAPIGateway('')
  // console.log('y: ' + JSON.stringify(y))

  // const answer = await cside.test('getRefreshToken')
  // // console.log('answer: ' + answer)
  // // console.log('answer2: ' + JSON.stringify(answer))
})())
