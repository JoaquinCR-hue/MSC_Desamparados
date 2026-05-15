module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Users', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      fullName: { type: Sequelize.STRING(150) },
      email: { type: Sequelize.STRING(100) },
      password: { type: Sequelize.STRING(255) },
      phone: { type: Sequelize.STRING(20) },
      nationalId: { type: Sequelize.STRING(25) },
      roleId: {
        type: Sequelize.INTEGER,
        references: { model: 'Roles', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL'
      }
    });
  },
  down: async (queryInterface) => { await queryInterface.dropTable('Users'); }
};