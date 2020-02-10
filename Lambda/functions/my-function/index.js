const zession = require('./zorg/zession.js');

exports.handler = async (event) => {
    const authorization = event.headers.Authorization; // After authenticated by Cognito.
    const token = authorization.slice(7); // Remove the 'Bearer ' prefix.
    let body = await zession.validateToken(token);

    // A real function would check body.isValid, then do other stuff.

    const response = {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': 'https://imalogit.com',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    };
    return response;
};
