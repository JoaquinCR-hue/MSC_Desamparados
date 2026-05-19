const { User, Role } = require('./src/models');

async function check() {
  try {
    const users = await User.findAll({ include: [{ model: Role, as: 'role' }] });
    console.log(users.map(u => ({
      email: u.email,
      role: u.role ? u.role.name : 'no-role'
    })));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
check();
