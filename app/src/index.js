;((async () => {
  const cside = require('../../my/cside')

  const initalRefreshToken = window.localStorage.getItem('refreshToken')
  console.log('initalRefreshToken: ' + initalRefreshToken)
  await cside.refreshSession()

  // const y = cside.heyAPIGateway('')
  // console.log('y: ' + JSON.stringify(y))

  // document.getElementById('mySpan').innerHTML = '<mark>' + window.localStorage.getItem('userName') + '</mark> has signed in.'
})())
