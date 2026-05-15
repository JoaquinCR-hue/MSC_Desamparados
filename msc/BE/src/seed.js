const { Role } = require('./models');

const seedDatabase = async () => {
  try {
    const rolesCount = await Role.count();
    if (rolesCount === 0) {
      console.log('🌱 Sembrando roles iniciales...');
      await Role.bulkCreate([
        { id: 1, name: 'admin', description: 'Administrador del sistema' },
        { id: 2, name: 'funcionario', description: 'Oficial de policía o funcionario municipal' },
        { id: 3, name: 'ciudadano', description: 'Ciudadano de Desamparados' }
      ]);
      console.log('✅ Roles sembrados exitosamente.');
    }
  } catch (error) {
    console.error('❌ Error al sembrar la base de datos:', error);
  }
};

module.exports = seedDatabase;
