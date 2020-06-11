const sside = require('/opt/nodejs/my/sside.js')
const AWS = require('aws-sdk')
AWS.config.update({ region: 'us-east-1' })
const ddb = new AWS.DynamoDB({ apiVersion: '2012-08-10' })
// const ddbDoc = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' })

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
    return sside.makeResponse(results)
  }

  const session = await sside.validateToken(token).catch(err => {
    results.message = err.message
    return sside.makeResponse(results)
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
  const myPromise = ddb.query(params).promise()
  const myResponse = myPromise.then(data => sside.makeResponse(data)).catch(err => sside.makeResponse(err))
  return myResponse
}
