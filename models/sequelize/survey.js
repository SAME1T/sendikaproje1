const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Survey extends Model {
    static associate(models) {
      Survey.belongsTo(models.Sendikaci, {
        foreignKey: 'createdBy',
        as: 'creator'
      });
      Survey.belongsToMany(models.Isci, {
        through: 'SurveyResponses',
        foreignKey: 'surveyId',
        as: 'respondents'
      });
    }
  }

  Survey.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    questions: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    startDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    endDate: {
      type: DataTypes.DATE
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'active'
    },
    createdBy: {
      type: DataTypes.INTEGER,
      references: {
        model: 'sendikacilar',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'Survey',
    tableName: 'surveys',
    timestamps: true,
    paranoid: true
  });

  return Survey;
}; 