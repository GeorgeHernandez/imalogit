const AWS = require('aws-sdk')
// const uuid = require('uuid')
const sside = require('/opt/nodejs/my/sside.js')
const ddb = new AWS.DynamoDB()

exports.handler = async (event) => {
  const authorization = event.headers.Authorization // Authenticated by Cognito.
  const token = authorization.slice(7) // Remove the 'Bearer ' prefix.
  const bearerType = (token.length > 40) ? 'id_token' : 'code'

  const results = {} // Fill with whatever the real function needs.
  results.success = false
  results.message = '' // Usually ignored if successful
  results.dataCount = 0 // Usually a count of the objects in the data
  results.data = [] // Usually an array of just key-value objects. E.g. [{name: 'Abe', age: 3}, {name: ' Boo', age: 4}]

  const session = await sside.validateToken(token).catch(err => {
    results.message = err.message
    return makeResponse(results)
  })

  // A real function would do the above session check, but then do other stuff.
  // For now I'll stick in random stuff

  if (bearerType === 'id_token') {
    results.success = true
    results.message = 'Hi from Lambda'
    results.dataCount = 1

    // DynamoDB data:
    const params = {
      TableName: 'imalogit',
      KeyConditionExpression: 'parent = :v1',
      ExpressionAttributeValues: { ':v1': { S: 'u.' + session.claims.sub } }
    }
    // console.log(params)
    results.data[0] = params
    return makeResponse(results)

    // ddb.query(params, function (err, data) {
    //   if (err) return makeResponse(err, err.stack)
    //   else return makeResponse(data)
    // })
  } else if (bearerType === 'code') {
    results.message = 'We do not take code'
  }
}

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
