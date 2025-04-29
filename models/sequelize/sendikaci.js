const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Sendikaci extends Model {
    static associate(models) {
      Sendikaci.hasMany(models.Message, {
        foreignKey: 'sendikaciId',
        as: 'messages'
      });
      Sendikaci.hasMany(models.Survey, {
        foreignKey: 'sendikaciId',
        as: 'surveys'
      });
    }
  }

  Sendikaci.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    tcno: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        len: [11, 11],
        isNumeric: true
      }
    },
    ad: {
      type: DataTypes.STRING,
      allowNull: false
    },
    soyad: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    sifre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    telefon: {
      type: DataTypes.STRING,
      validate: {
        is: /^[0-9]{10}$/
      }
    },
    rol: {
      type: DataTypes.STRING,
      defaultValue: 'sendikaci'
    },
    aktif: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'Sendikaci',
    tableName: 'sendikacilar',
    timestamps: true,
    paranoid: true
  });

  return Sendikaci;
}; 