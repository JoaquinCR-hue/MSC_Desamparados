require('dotenv').config();
const { Role } = require('./models');

const updateRoles = async () => {
  try {
    await Role.update({ name: 'funcionario', description: 'Oficial de policía o funcionario municipal' }, { where: { id: 2 } });
    await Role.update({ name: 'ciudadano', description: 'Ciudadano de Desamparados' }, { where: { id: 3 } });
    console.log('Roles actualizados en BD');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
};

updateRoles();
