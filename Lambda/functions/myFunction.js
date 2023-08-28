const AWS = require('aws-sdk')
// const uuid = require('uuid')

AWS.config.update({ region: 'us-east-1' })
AWS.config.apiVersions = {
  dynamodb: '2012-08-10',
  s3: '2006-03-01'
}

exports.handler = async (event) => {
  // // This works as only content of this function:
  // const results = {} // Fill with whatever the real function needs.
  // results.success = false
  // results.message = '' // Usually ignored if successful
  // results.dataCount = '' // Usually a count of the objects in the data
  // results.data = '' // Usually an array of non-nested objects
  // return results

  // // This works as only content of this function:
  // // listTables() returns AWS.Request, but promise() returns a thenable promise
  // const ddb = new AWS.DynamoDB()
  // return ddb.listTables().promise()

  // // This works as only content of this function:
  // const ddb = new AWS.DynamoDB()
  // const myPromise = ddb.listTables().promise()
  // return myPromise

  // This works as only content of this function:
  const ddb = new AWS.DynamoDB()
  const myPromise = ddb.listTables().promise().catch(err => {
    return makeResponse(err)
  })
  return myPromise
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
