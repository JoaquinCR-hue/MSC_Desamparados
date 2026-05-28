module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Reports', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      description: { type: Sequelize.TEXT },
      date: { type: Sequelize.DATE },
      status: { type: Sequelize.STRING(25) },
      userId: {
        type: Sequelize.INTEGER,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL'
      },
      incidentTypeId: {
        type: Sequelize.INTEGER,
        references: { model: 'IncidentTypes', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL'
      },
      locationId: {
        type: Sequelize.INTEGER,
        references: { model: 'Locations', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL'
      }
    });
  },
  down: async (queryInterface) => { await queryInterface.dropTable('Reports'); }
};