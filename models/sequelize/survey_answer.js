const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class SurveyAnswer extends Model {}

  SurveyAnswer.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    survey_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    question_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    answer: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'SurveyAnswer',
    tableName: 'survey_answer',
    timestamps: false
  });

  return SurveyAnswer;
}; 