const zession = require('./zorg/zession.js');

exports.handler = async (event) => {
    const authorization = event.headers.Authorization; // After authenticated by Cognito.
    const token = authorization.slice(7); // Remove the 'Bearer ' prefix.
    const session = await zession.validateToken(token);
    const data = {}; // Return with session meta + whatever the real function should.

    // A real function would check session.isValid, then do other stuff.
    if (session.isValid) {
        data.session = {};
        data.session.isValid = true;
        data.session.claims = session.goodSignature;
    } else {
        data.session.isValid = false;
        // Add other info as needed.
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
