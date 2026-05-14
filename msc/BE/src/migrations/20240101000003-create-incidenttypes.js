module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('IncidentTypes', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      name: { type: Sequelize.STRING(60) },
      description: { type: Sequelize.STRING(150) },
      severity: { type: Sequelize.STRING(20) }
    });
  },
  down: async (queryInterface) => { await queryInterface.dropTable('IncidentTypes'); }
};