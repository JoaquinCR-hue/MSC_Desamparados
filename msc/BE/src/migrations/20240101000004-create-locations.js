module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Locations', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      province: { type: Sequelize.STRING(35) },
      canton: { type: Sequelize.STRING(45) },
      district: { type: Sequelize.STRING(45) },
      neighborhood: { type: Sequelize.STRING(45) },
      street: { type: Sequelize.STRING(100) },
      exactAddress: { type: Sequelize.TEXT },
      lat: { type: Sequelize.DECIMAL(10, 8) },
      lng: { type: Sequelize.DECIMAL(11, 8) }
    });
  },
  down: async (queryInterface) => { await queryInterface.dropTable('Locations'); }
};