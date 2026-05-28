require('dotenv').config();
const { User, Role } = require('./src/models');

async function setup() {
  try {
    // Asegurar que existe el rol Admin
    const [adminRole] = await Role.findOrCreate({
      where: { id: 1 },
      defaults: { name: 'administrador', description: 'Administrador del sistema' }
    });

    // Crear usuario admin de prueba
    const [user, created] = await User.findOrCreate({
      where: { email: 'admin@msc.com' },
      defaults: {
        fullName: 'Administrador de Pruebas',
        password: 'admin123',
        phone: '88888888',
        nationalId: '123456789',
        roleId: 1
      }
    });

    if (created) {
      console.log('✅ Usuario ADMIN creado exitosamente.');
      console.log('📧 Email: admin@msc.com');
      console.log('🔑 Pass: admin123');
    } else {
      // Actualizar password por si acaso
      await user.update({ password: 'admin123' });
      console.log('✅ Usuario ADMIN ya existía. Password actualizado a: admin123');
    }
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e);
    process.exit(1);
  }
}
setup();
