;((async () => {
  const cside = require('../../my/cside')

  const y = await cside.heyAPIGateway('/logs')
  console.log('y: ' + JSON.stringify(y))

  document.getElementById('mySpan').innerHTML = '<mark>' + window.localStorage.getItem('userName') + '</mark> has signed in.'
})())
