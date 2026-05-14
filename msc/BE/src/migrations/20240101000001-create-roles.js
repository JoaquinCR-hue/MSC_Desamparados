module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Roles', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      name: { type: Sequelize.STRING(45) },
      description: { type: Sequelize.STRING(150) }
    });
  },
  down: async (queryInterface) => { await queryInterface.dropTable('Roles'); }
};