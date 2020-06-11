const AWS = require('aws-sdk')
// const uuid = require('uuid')
const sside = require('/opt/nodejs/my/sside.js')
const ddb = new AWS.DynamoDB()

exports.handler = async (event, context) => {
  const authorization = event.headers.Authorization // Authenticated by Cognito.
  const token = authorization.slice(7) // Remove the 'Bearer ' prefix.
  const bearerType = (token.length > 40) ? 'id_token' : 'code'

  const results = {} // Fill with whatever the real function needs.
  results.success = false
  results.message = '' // Usually ignored if successful
  results.dataCount = 0 // Usually a count of the objects in the data
  results.data = [] // Usually an array of just key-value objects. E.g. [{name: 'Abe', age: 3}, {name: ' Boo', age: 4}]

  // DEV ONLY:
  // return makeResponse(results)

  if (bearerType !== 'id_token') {
    results.message = 'Invalid token'
    return makeResponse(results)
  }

  const session = await sside.validateToken(token).catch(err => {
    results.message = err.message
    return makeResponse(results)
  })

  // A real function would do the above session check, but then do other stuff.
  // For now I'll stick in random stuff

  results.success = true
  results.message = 'Hi from ' + context.functionName + '()'
  results.dataCount = 1

  // DynamoDB data:
  const params = {
    TableName: 'imalogit',
    KeyConditionExpression: 'parent = :v1',
    ExpressionAttributeValues: { ':v1': { S: 'u.' + session.claims.sub } }
  }
  // console.log(params)
  // results.data[0] = params
  // // return results
  // return makeResponse(results)

  const myPromise = ddb.query(params).promise()
  // return myPromise // Works
  // return myPromise.then(data => data).catch(err => err) // Works
  const myResponse = myPromise.then(data => makeResponse(data)).catch(err => makeResponse(err))
  return myResponse
}

/**
 * Take some data and wrap in JSON expected by API Gateway.
 * @param {string} results Some sort of data the client asked for.
 * @returns {object} A JSON object expected by API Gateway.
 */
function makeResponse (results) {
  const response = {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': 'https://imalogit.com',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(results)
  }
  return response
}
