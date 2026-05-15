module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Consults', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      nationalId: { type: Sequelize.STRING(25) },
      fullName: { type: Sequelize.STRING(150) },
      email: { type: Sequelize.STRING(100) },
      phone: { type: Sequelize.STRING(20) },
      consultType: { type: Sequelize.STRING(50) },
      description: { type: Sequelize.TEXT },
      date: { type: Sequelize.DATE },
      status: { type: Sequelize.STRING(25), defaultValue: 'Pendiente' },
      response: { type: Sequelize.TEXT },
      responseDate: { type: Sequelize.DATE }
    });
  },
  down: async (queryInterface) => { await queryInterface.dropTable('Consults'); }
};