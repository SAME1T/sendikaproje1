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
db.SurveyQuestion = require('./survey_question')(sequelize);
db.AnonymousData = require('./anonymousData')(sequelize);
db.Payroll = require('./payroll')(sequelize);
db.SurveyAnswer = require('./survey_answer')(sequelize);

// Associations
Object.values(db).forEach((model) => {
  if (model.associate) {
    model.associate(db);
  }
});

db.Survey.hasMany(db.SurveyQuestion, { foreignKey: 'survey_id', as: 'questions' });
db.SurveyQuestion.belongsTo(db.Survey, { foreignKey: 'survey_id', as: 'survey' });

module.exports = db; 