const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Message extends Model {
    static associate(models) {
      Message.belongsTo(models.Isci, {
        foreignKey: 'isciId',
        as: 'isci'
      });
      Message.belongsTo(models.Sendikaci, {
        foreignKey: 'sendikaciId',
        as: 'sendikaci'
      });
    }
  }

  Message.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'normal'
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    privacy: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'public'
    },
    oncelik: {
      type: DataTypes.STRING,
      defaultValue: 'normal'
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'beklemede'
    },
    isciId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'isciler',
        key: 'id'
      }
    },
    sendikaciId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'sendikacilar',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'Message',
    tableName: 'messages',
    timestamps: true,
    paranoid: true
  });

  return Message;
}; 