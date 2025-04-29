const { Sequelize } = require('sequelize');
const config = require('../../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    logging: false
  }
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Models
db.Sendikaci = require('./sendikaci')(sequelize);
db.Isci = require('./isci')(sequelize);
db.Message = require('./message')(sequelize);
db.Survey = require('./survey')(sequelize);
db.AnonymousData = require('./anonymousData')(sequelize);

// Associations
Object.values(db).forEach((model) => {
  if (model.associate) {
    model.associate(db);
  }
});

module.exports = db; 