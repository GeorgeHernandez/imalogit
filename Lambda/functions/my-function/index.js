const zession = require('./zorg/zession.js');

exports.handler = async (event) => {
    const authorization = event.headers.Authorization; // After authenticated by Cognito.
    const token = authorization.slice(7); // Remove the 'Bearer ' prefix.

    // let session = new Zession(token);
    // let body = {};
    let body = await zession.validateToken(token);
    body.myAsync = await zession.myAsync('ma');
    body.myNoAsync = zession.myNoAsync('mna');
    body.myProperty = zession.myProperty;

    // Now do whatever you want with the verified claims!
    body.email = body.goodSignature.email;
    body.sub = body.goodSignature.sub; // Subject, i.e. the UUID for the user in the Cognito user pool
    // console.log("event: ", util.inspect(event, { showHidden: false, depth: null })); // To see input in CloudWatch

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
