'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Önce survey tablosunu oluştur
    await queryInterface.createTable('survey', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Sonra survey_question tablosunu oluştur
    await queryInterface.createTable('survey_question', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      survey_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'survey',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      question_text: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      options: {
        type: Sequelize.JSONB,
        allowNull: true
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('survey_question');
    await queryInterface.dropTable('survey');
  }
};
