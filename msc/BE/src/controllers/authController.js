const { User, Role } = require('../models');
const jwt = require('jsonwebtoken');

/**
 * Genera un token JWT para el usuario.
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role ? user.role.name : 'ciudadano' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '3m' }
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

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      data: {
        id: newUser.id,
        fullName: newUser.fullName,
        email: newUser.email,
        token
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

    res.json({
      message: 'Inicio de sesión exitoso',
      data: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role ? user.role.name : 'ciudadano',
        token
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
  res.json({ message: 'Sesión cerrada exitosamente. Invalide el token en el cliente.' });
};

module.exports = {
  register,
  login,
  logout
};
