const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Survey extends Model {}

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
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'aktif'
    }
  }, {
    sequelize,
    modelName: 'Survey',
    tableName: 'survey',
    timestamps: false
  });

  // Survey.hasMany(sequelize.models.SurveyQuestion, { foreignKey: 'survey_id', as: 'questions' });

  return Survey;
}; 