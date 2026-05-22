// Compatibility shim — older routes do `const pool = require('../db')`.
// Wraps the same pg Pool used by server.js so they share a connection pool.
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

module.exports = pool;
