'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('survey', 'created_by', {
      type: Sequelize.INTEGER,
      allowNull: false,
      // İsterseniz foreign key olarak sendikacilar tablosuna referans ekleyebilirsiniz
    });
    await queryInterface.addColumn('survey', 'status', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'aktif'
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('survey', 'created_by');
    await queryInterface.removeColumn('survey', 'status');
  }
};
