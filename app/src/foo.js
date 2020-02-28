;((async () => {
  const cside = require('../../my/cside')

  const heyAPIGatewayViaFoo = await cside.heyAPIGateway('')
  console.log('heyAPIGatewayViaFoo: ' + JSON.stringify(heyAPIGatewayViaFoo))

  document.getElementById('mySpan').innerHTML = '<mark>Hi' + window.localStorage.getItem('userName') + '</mark>.'
})())
