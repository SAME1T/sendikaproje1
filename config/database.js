module.exports = {
  development: {
    username: 'postgres',
    password: 'Samet6380.',
    database: 'sendikaprojesi',
    host: 'localhost',
    dialect: 'postgres'
  },
  test: {
    username: 'postgres',
    password: 'Samet6380.',
    database: 'sendikaprojesi_test',
    host: 'localhost',
    dialect: 'postgres'
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: 'postgres',
    ssl: true,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
}; 