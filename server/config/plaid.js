const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');

// Initialize the Plaid client
// NOTE: NEVER store API keys in source code in production!
// These should be environment variables
const configuration = new Configuration({
  basePath: PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': '6822e1fce7c0ba00230a1447', // Replace with your Plaid client ID
      'PLAID-SECRET': 'ee659abfc85b20ea6bf0c9595e4486',       // Replace with your Plaid secret
    },
  },
});

const plaidClient = new PlaidApi(configuration);

module.exports = plaidClient; 