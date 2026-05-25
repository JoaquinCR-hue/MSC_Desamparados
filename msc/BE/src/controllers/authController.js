const { User, Role } = require('../models');
const jwt = require('jsonwebtoken');
const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
/**
 * Genera un token JWT para el usuario.
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role ? user.role.name : 'ciudadano' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
  );
};

/**
 * Registro de un nuevo usuario.
 */
const register = async (req, res) => {
  try {
    const { fullName, email, password, phone, nationalId, roleId } = req.body;

    // Verificar si el usuario ya existe por email o cédula
    const existingUser = await User.findOne({ 
      where: {
        [require('sequelize').Op.or]: [{ email }, { nationalId }]
      } 
    });
    
    if (existingUser) {
      const field = existingUser.email === email ? 'El correo' : 'La cédula';
      return res.status(400).json({ message: `${field} ya está registrado en el sistema.` });
    }
    if (!regex.test(password)) {
      return res.status(400).json({ 
        message: 'La contraseña debe tener al menos 6 caracteres, incluyendo una mayúscula, una minúscula y un número.' 
      });
    }
    // Crear el usuario (el password se hashea en el hook del modelo)
    const newUser = await User.create({
      fullName,
      email,
      password,
      phone,
      nationalId,
      roleId: roleId || 3
    });

    const token = generateToken(newUser);

    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 2 * 60 * 60 * 1000 // 2 hours
    });

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      data: {
        id: newUser.id,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.roleId === 1 ? 'administrador' : (newUser.roleId === 2 ? 'funcionario' : 'ciudadano')
      }
    });
  } catch (error) {
    console.error('Error en el registro:', error);
    res.status(500).json({ 
      message: `Error al registrar: ${error.message}` 
    });
  }
};

/**
 * Inicio de sesión.
 */
const login = async (req, res) => {
  try {
    const { email, nationalId, password } = req.body;

    // Buscar usuario por email o por cédula (nationalId)
    const user = await User.findOne({ 
      where: email ? { email } : { nationalId },
      include: [{ model: Role, as: 'role' }]
    });

    if (!user || !(await user.validatePassword(password))) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = generateToken(user);

    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 2 * 60 * 60 * 1000 // 2 hours
    });

    res.json({
      message: 'Inicio de sesión exitoso',
      data: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role ? user.role.name : 'ciudadano'
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al iniciar sesión' });
  }
};

/**
 * Cierre de sesión (Frontend debe descartar el token).
 * En el backend, para invalidar realmente el token se necesitaría una lista negra en Redis.
 */
const logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
  res.json({ message: 'Sesión cerrada exitosamente.' });
};

/**
 * Recuperación de contraseña
 * Genera una nueva y la guarda, devolviéndola para que el frontend la envíe.
 */
const recoverPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'Ese correo no está registrado' });
    }
    const newPassword = Math.random().toString(36).slice(-8);
    await user.update({ password: newPassword });
    res.json({ message: 'Contraseña recuperada exitosamente', newPassword });
  } catch (error) {
    console.error('Error al recuperar contraseña:', error);
    res.status(500).json({ message: 'Error al recuperar contraseña' });
  }
};

module.exports = {
  register,
  login,
  logout,
  recoverPassword
};
