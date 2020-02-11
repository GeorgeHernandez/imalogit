const zession = require('./zorg/zession.js');

exports.handler = async (event) => {
  const authorization = event.headers.Authorization; // After authenticated by Cognito.
  const token = authorization.slice(7); // Remove the 'Bearer ' prefix.
  let session;
  let data = {}; // Fill with session meta + whatever the real function should.
  data.session = {};
  try {
    session = await zession.validateToken(token);
    if (session.isValid) {
      data.session.isValid = true;
      data.session.claims = session.goodSignature;
    } else {
      data.session.isValid = false;
      // Add other info as needed.
    }
    // A real function would do the above session check, but then do other stuff.
  } catch(e) {
    data.session.error = e;
    data.session.isValid = false;
  }

  const response = {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': 'https://imalogit.com',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  };
  return response;
};
