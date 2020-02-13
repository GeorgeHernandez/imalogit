const zession = require('./zorg/zession.js')

exports.handler = async (event) => {
  const authorization = event.headers.Authorization // Authenticated by Cognito.
  const token = authorization.slice(7) // Remove the 'Bearer ' prefix.
  const bearerType = (token.length > 40) ? 'id_token' : 'code'

  let session
  const data = {} // Fill with session meta + whatever the real function should.
  data.session = {}
  data.session.bearerType = bearerType

  if (bearerType === 'id_token') {
    try {
      session = await zession.validateToken(token)
      if (session.isValid) {
        data.session.isValid = true
        data.session.claims = session.goodSignature
      } else {
        data.session.isValid = false
        throw session.error
      }
      // A real function would do the above session check, but then do other stuff.
      data.foo = 'bar'
    } catch (e) {
      data.session.error = e
      data.session.isValid = false
    }
  } else if (bearerType === 'code') {
    data.session.isValid = true
    data.session.claims = {}
    data.session.claims.email = token
  }

  return makeResponse(data)
}

function makeResponse (data) {
  const response = {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': 'https://imalogit.com',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  }
  return response
}
