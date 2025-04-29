const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Isci extends Model {
    static associate(models) {
      Isci.hasMany(models.Message, {
        foreignKey: 'isciId',
        as: 'messages'
      });
      Isci.belongsToMany(models.Survey, {
        through: 'SurveyResponses',
        foreignKey: 'isciId',
        as: 'surveys'
      });
    }
  }

  Isci.init({
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
    isyeri: {
      type: DataTypes.STRING,
      allowNull: false
    },
    departman: {
      type: DataTypes.STRING
    },
    rol: {
      type: DataTypes.STRING,
      defaultValue: 'isci'
    },
    aktif: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'Isci',
    tableName: 'isciler',
    timestamps: true,
    paranoid: true
  });

  return Isci;
}; 