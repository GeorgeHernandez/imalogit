exports.handler = async (event) => {
  const response = {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': 'https://imalogit.com',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify('Hello world!')
  }
  return response
}
