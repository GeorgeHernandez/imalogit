(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
((async () => {
  // const cside = require('../../my/cside')

  // const authorizationCode = cside.readAuthorizationCode()
  // // console.log('authorizationCode: ' + authorizationCode)

  // const responseToCode = await cside.exchangeCode(authorizationCode)
  // // console.log('JSON.stringify(responseToCode): ' + JSON.stringify(responseToCode))
  // const session = {}
  // session.claims = responseToCode.claims
  // session.claims.name = responseToCode.claims['cognito:username']
  // session.tokens0 = responseToCode.tokens
  // // console.log('JSON.stringify(session): ' + JSON.stringify(session))

  // const responseToRefreshToken = await cside.exchangeRefreshToken(session.tokens0.refresh_token)
  // session.tokens = responseToRefreshToken.tokens
  // // console.log('JSON.stringify(responseToRefreshToken): ' + JSON.stringify(responseToRefreshToken))
  // console.log('JSON.stringify(session): ' + JSON.stringify(session))

  // document.getElementById('mySpan').innerHTML = '<mark>' + session.claims.name + ' (' + session.claims.email + ')</mark> has signed in.'

  const userName = window.localStorage.getItem('CognitoIdentityServiceProvider.1aosnlgh8roam75comsp77fhd1.LastAuthUser')
  document.getElementById('mySpan').innerHTML = '<mark>' + userName + '</mark> has signed in.'
})())

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImFwcC9zcmMvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIigoYXN5bmMgKCkgPT4ge1xyXG4gIC8vIGNvbnN0IGNzaWRlID0gcmVxdWlyZSgnLi4vLi4vbXkvY3NpZGUnKVxyXG5cclxuICAvLyBjb25zdCBhdXRob3JpemF0aW9uQ29kZSA9IGNzaWRlLnJlYWRBdXRob3JpemF0aW9uQ29kZSgpXHJcbiAgLy8gLy8gY29uc29sZS5sb2coJ2F1dGhvcml6YXRpb25Db2RlOiAnICsgYXV0aG9yaXphdGlvbkNvZGUpXHJcblxyXG4gIC8vIGNvbnN0IHJlc3BvbnNlVG9Db2RlID0gYXdhaXQgY3NpZGUuZXhjaGFuZ2VDb2RlKGF1dGhvcml6YXRpb25Db2RlKVxyXG4gIC8vIC8vIGNvbnNvbGUubG9nKCdKU09OLnN0cmluZ2lmeShyZXNwb25zZVRvQ29kZSk6ICcgKyBKU09OLnN0cmluZ2lmeShyZXNwb25zZVRvQ29kZSkpXHJcbiAgLy8gY29uc3Qgc2Vzc2lvbiA9IHt9XHJcbiAgLy8gc2Vzc2lvbi5jbGFpbXMgPSByZXNwb25zZVRvQ29kZS5jbGFpbXNcclxuICAvLyBzZXNzaW9uLmNsYWltcy5uYW1lID0gcmVzcG9uc2VUb0NvZGUuY2xhaW1zWydjb2duaXRvOnVzZXJuYW1lJ11cclxuICAvLyBzZXNzaW9uLnRva2VuczAgPSByZXNwb25zZVRvQ29kZS50b2tlbnNcclxuICAvLyAvLyBjb25zb2xlLmxvZygnSlNPTi5zdHJpbmdpZnkoc2Vzc2lvbik6ICcgKyBKU09OLnN0cmluZ2lmeShzZXNzaW9uKSlcclxuXHJcbiAgLy8gY29uc3QgcmVzcG9uc2VUb1JlZnJlc2hUb2tlbiA9IGF3YWl0IGNzaWRlLmV4Y2hhbmdlUmVmcmVzaFRva2VuKHNlc3Npb24udG9rZW5zMC5yZWZyZXNoX3Rva2VuKVxyXG4gIC8vIHNlc3Npb24udG9rZW5zID0gcmVzcG9uc2VUb1JlZnJlc2hUb2tlbi50b2tlbnNcclxuICAvLyAvLyBjb25zb2xlLmxvZygnSlNPTi5zdHJpbmdpZnkocmVzcG9uc2VUb1JlZnJlc2hUb2tlbik6ICcgKyBKU09OLnN0cmluZ2lmeShyZXNwb25zZVRvUmVmcmVzaFRva2VuKSlcclxuICAvLyBjb25zb2xlLmxvZygnSlNPTi5zdHJpbmdpZnkoc2Vzc2lvbik6ICcgKyBKU09OLnN0cmluZ2lmeShzZXNzaW9uKSlcclxuXHJcbiAgLy8gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ215U3BhbicpLmlubmVySFRNTCA9ICc8bWFyaz4nICsgc2Vzc2lvbi5jbGFpbXMubmFtZSArICcgKCcgKyBzZXNzaW9uLmNsYWltcy5lbWFpbCArICcpPC9tYXJrPiBoYXMgc2lnbmVkIGluLidcclxuXHJcbiAgY29uc3QgdXNlck5hbWUgPSB3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0oJ0NvZ25pdG9JZGVudGl0eVNlcnZpY2VQcm92aWRlci4xYW9zbmxnaDhyb2FtNzVjb21zcDc3ZmhkMS5MYXN0QXV0aFVzZXInKVxyXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdteVNwYW4nKS5pbm5lckhUTUwgPSAnPG1hcms+JyArIHVzZXJOYW1lICsgJzwvbWFyaz4gaGFzIHNpZ25lZCBpbi4nXHJcbn0pKCkpXHJcbiJdfQ==
