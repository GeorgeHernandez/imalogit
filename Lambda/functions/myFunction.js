const sside = require('/opt/nodejs/my/sside.js')
const AWS = require('aws-sdk')
AWS.config.update({ region: 'us-east-1' })
const ddb = new AWS.DynamoDB({ apiVersion: '2012-08-10' })
const ddbDoc = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' })

exports.handler = async (event) => {
  // OPTION:
  // return 'Hello, World!'

  // OPTION:
  // const results = {} // Fill with whatever the real function needs.
  // results.success = false
  // results.message = '' // Usually ignored if successful
  // results.dataCount = '' // Usually a count of the objects in the data
  // results.data = '' // Usually an array of non-nested objects
  // return results

  // OPTION:
  // const ddb = new AWS.DynamoDB()
  // const myPromise = ddb.listTables().promise()
  // return myPromise

  // OPTION:
  // const myPromise = ddb.listTables().promise()
  // const myResponse = myPromise.then(data => sside.makeResponse(data)).catch(err => sside.makeResponse(err))
  // return myResponse

  // OPTION:
  // const params = {
  //   Key: { parent: 'u.076bd522-c86f-4b80-95ca-127e404f7e08', title: 'Weight' },
  //   TableName: 'imalogit'
  // }
  // const myPromise = ddbDoc.get(params).promise()
  // const myResponse = myPromise.then(data => sside.makeResponse(data)).catch(err => sside.makeResponse(err))
  // return myResponse

  // OPTION:
  // const params = {
  //   KeyConditionExpression: 'parent = :p',
  //   ExpressionAttributeValues: { ':p': { S: 'u.076bd522-c86f-4b80-95ca-127e404f7e08' } },
  //   TableName: 'imalogit'
  // }
  // const myPromise = ddb.query(params).promise()
  // const myResponse = myPromise.then(data => sside.makeResponse(data)).catch(err => sside.makeResponse(err))
  // return myResponse

  // OPTION:
  const params = {
    KeyConditionExpression: 'parent = :p',
    ExpressionAttributeValues: { ':p': 'u.076bd522-c86f-4b80-95ca-127e404f7e08' },
    TableName: 'imalogit'
  }
  const myPromise = ddbDoc.query(params).promise()
  const myResponse = myPromise.then(data => sside.makeResponse(data)).catch(err => sside.makeResponse(err))
  return myResponse
}
