module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Patrols', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      officerNames: { type: Sequelize.STRING(255) },
      unit: { type: Sequelize.STRING(50) },
      status: { type: Sequelize.STRING(50) },
      zone: { type: Sequelize.STRING(100) },
      unitType: { type: Sequelize.STRING(50) },
      schedule: { type: Sequelize.STRING(100) },
      lat: { type: Sequelize.DECIMAL(10, 8) },
      lng: { type: Sequelize.DECIMAL(11, 8) }
    });
  },
  down: async (queryInterface) => { await queryInterface.dropTable('Patrols'); }
};