((async () => {
  // const cside = require('../../my/cside')

  // const authorizationCode = cside.readAuthorizationCode()
  // // console.log('authorizationCode: ' + authorizationCode)

  // const responseToCode = await cside.exchangeCode(authorizationCode)
  // // console.log('JSON.stringify(responseToCode): ' + JSON.stringify(responseToCode))
  // const session = {}
  // session.claims = responseToCode.claims
  // session.claims.name = responseToCode.claims['cognito:username']
  // session.tokens0 = responseToCode.tokens
  // // console.log('JSON.stringify(session): ' + JSON.stringify(session))

  // const responseToRefreshToken = await cside.exchangeRefreshToken(session.tokens0.refresh_token)
  // session.tokens = responseToRefreshToken.tokens
  // // console.log('JSON.stringify(responseToRefreshToken): ' + JSON.stringify(responseToRefreshToken))
  // console.log('JSON.stringify(session): ' + JSON.stringify(session))

  // document.getElementById('mySpan').innerHTML = '<mark>' + session.claims.name + ' (' + session.claims.email + ')</mark> has signed in.'

  const userName = window.localStorage.getItem('CognitoIdentityServiceProvider.1aosnlgh8roam75comsp77fhd1.LastAuthUser')
  document.getElementById('mySpan').innerHTML = '<mark>' + userName + '</mark> has signed in.'
})())
