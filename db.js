const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'sendikaprojesi',
    password: 'Samet6380.',
    port: 5432,
});

module.exports = pool; 