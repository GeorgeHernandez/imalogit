# Ima Log It

Log stuff quickly.

The goal of this app is to allow users to quickly access logs, log entries, and see simple run-time charts for these logs. For more, see our [About Us](https://imalogit.com/about.html).

Summary notes on the repo content

- `/`. The static site content plus some other stuff.
    - `.gitignore`
    - `package.json`. Used by `cside`.
    - `schema.yml`. Notes on the DynamoDB and API Gateway schema.
- `/app/`. The dynamic site content that interacts with the backend AWS services.
    - `/app/src/`. The client-side source code that is "compiled" by Browserify to  `/app/`.
- `/Lambda/`. Backend code for AWS Lambda functions and layers.
    - `/Lambda/functions/`. My AWS Lambda functions, usuall called by the app vie AWS API Gateway.
    - `/Lambda/layers/uno/`. My `sside` Node.js for the Lambda functions to use.
- `/my/`. My `cside` Node.js for the site's app to interact with backend AWS services.
    - `/my/out/`. Documentation for `cside` that I periodically create with JSDoc.
