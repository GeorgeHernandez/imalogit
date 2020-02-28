;((async () => {
  const cside = require('../../my/cside')

  const heyAPIGatewayViaFoo = await cside.heyAPIGateway('')
  console.log('heyAPIGatewayViaFoo: ' + JSON.stringify(heyAPIGatewayViaFoo))

  document.getElementById('mySpan').innerHTML = 'Hi <mark>' + window.localStorage.getItem('userName') + '</mark>.'
})())
