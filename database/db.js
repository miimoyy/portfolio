const { createClient } = require('@libsql/client');

let _client = null;

function getClient() {
  if (!_client) {
    if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
      throw new Error('TURSO_DATABASE_URL dan TURSO_AUTH_TOKEN harus diset di environment variables');
    }
    _client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return _client;
}

module.exports = { getClient };
