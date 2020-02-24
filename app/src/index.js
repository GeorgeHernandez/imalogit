((async () => {
  const csession = require('../../my/csession')
  const authorizationCode = csession.readAuthorizationCode()
  // console.log('authorizationCode: ' + authorizationCode)
  // const tokens = csession.exchangeCodeForTokens(authorizationCode).then(r => r).catch(e => console.log('e:' + e))
  const tokens = await csession.exchangeCodeForTokens(authorizationCode)
  // console.log('JSON.stringify(tokens): ' + JSON.stringify(tokens))
  const answer = await csession.refreshTokens(tokens)
  console.log('JSON.stringify(answer): ' + JSON.stringify(answer))
  document.getElementById('asyncAnswer').innerHTML = '<mark>' + answer.userName + ' (' + answer.userEmail + ')</mark> has signed in.'
})())
