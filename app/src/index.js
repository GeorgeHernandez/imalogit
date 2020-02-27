;((async () => {
  const cside = require('../../my/cside')

  // const authorizationCode = cside.readAuthorizationCode()
  // // console.log('authorizationCode: ' + authorizationCode)

  // const responseToCode = await cside.exchangeCode(authorizationCode)
  // console.log('responseToCode: ' + JSON.stringify(responseToCode))

  const refreshToken = await cside.getRefreshToken()
  console.log('refreshToken: ' + JSON.stringify(refreshToken))

  // document.getElementById('mySpan').innerHTML = '<mark>' + session.claims.name + ' (' + session.claims.email + ')</mark> has signed in.'

  // const userName = window.localStorage.getItem('userName')
  // document.getElementById('mySpan').innerHTML = '<mark>' + userName + '</mark> has signed in.'

  // const initalRefreshToken = window.localStorage.getItem('CognitoIdentityServiceProvider.1aosnlgh8roam75comsp77fhd1.' + userName + '.refreshToken')
  // const x = await cside.foo(initalRefreshToken)
  // console.log('x: ' + JSON.stringify(x))

  // const y = cside.heyAPIGateway('')
  // console.log('y: ' + JSON.stringify(y))
})())
