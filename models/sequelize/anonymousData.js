const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class AnonymousData extends Model {}

  AnonymousData.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    sendika: {
      type: DataTypes.STRING,
      allowNull: false
    },
    isyeri: {
      type: DataTypes.STRING,
      allowNull: false
    },
    departman: {
      type: DataTypes.STRING,
      allowNull: false
    },
    mesaj: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'AnonymousData',
    tableName: 'anonymous_data',
    timestamps: true
  });

  return AnonymousData;
}; 