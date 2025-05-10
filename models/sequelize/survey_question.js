const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class SurveyQuestion extends Model {}

  SurveyQuestion.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    survey_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    question_text: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    options: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'SurveyQuestion',
    tableName: 'survey_question',
    timestamps: false
  });

  // SurveyQuestion.belongsTo(sequelize.models.Survey, { foreignKey: 'survey_id', as: 'survey' });
  return SurveyQuestion;
}; 