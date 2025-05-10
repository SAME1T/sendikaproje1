'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // survey table
    await queryInterface.createTable('survey', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      title: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT },
      created_by: { type: Sequelize.INTEGER, allowNull: false }, // sendikacı id
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      status: { type: Sequelize.STRING, allowNull: false, defaultValue: 'aktif' }
    });

    // survey_question table
    await queryInterface.createTable('survey_question', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      survey_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'survey', key: 'id' },
        onDelete: 'CASCADE'
      },
      question_text: { type: Sequelize.TEXT, allowNull: false },
      type: { type: Sequelize.STRING, allowNull: false }, // open/multiple
      options: { type: Sequelize.JSONB, allowNull: true }
    });

    // survey_answer table
    await queryInterface.createTable('survey_answer', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      survey_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'survey', key: 'id' },
        onDelete: 'CASCADE'
      },
      user_id: { type: Sequelize.INTEGER, allowNull: false }, // işçi id
      question_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'survey_question', key: 'id' },
        onDelete: 'CASCADE'
      },
      answer: { type: Sequelize.TEXT, allowNull: false },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('survey_answer');
    await queryInterface.dropTable('survey_question');
    await queryInterface.dropTable('survey');
  }
};
