require('dotenv').config();
const { User, Role } = require('./src/models');

async function setupTestUsers() {
  try {
    // Crear usuario funcionario
    const [funcionarioUser, funcionarioCreated] = await User.findOrCreate({
      where: { email: 'funcionario@msc.com' },
      defaults: {
        fullName: 'Oficial Juan García',
        password: 'funcionario123',
        phone: '87654321',
        nationalId: '987654321',
        roleId: 2
      }
    });

    if (funcionarioCreated) {
      console.log('✅ Usuario FUNCIONARIO creado exitosamente.');
      console.log('📧 Email: funcionario@msc.com');
      console.log('🔑 Cédula: 987654321');
      console.log('🔑 Pass: funcionario123');
    } else {
      await funcionarioUser.update({ password: 'funcionario123' });
      console.log('✅ Usuario FUNCIONARIO ya existía. Password actualizado.');
    }

    // Crear usuario ciudadano
    const [citizenUser, citizenCreated] = await User.findOrCreate({
      where: { email: 'ciudadano@msc.com' },
      defaults: {
        fullName: 'María López Rodríguez',
        password: 'ciudadano123',
        phone: '12345678',
        nationalId: '111223344',
        roleId: 3
      }
    });

    if (citizenCreated) {
      console.log('✅ Usuario CIUDADANO creado exitosamente.');
      console.log('📧 Email: ciudadano@msc.com');
      console.log('🔑 Cédula: 111223344');
      console.log('🔑 Pass: ciudadano123');
    } else {
      await citizenUser.update({ password: 'ciudadano123' });
      console.log('✅ Usuario CIUDADANO ya existía. Password actualizado.');
    }

    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e);
    process.exit(1);
  }
}

setupTestUsers();
