const jwt = require('jsonwebtoken');

/**
 * Middleware para verificar el token JWT.
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ message: 'Token de autenticación no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'La sesión ha expirado. Por favor, inicie sesión de nuevo.' });
    }
    return res.status(403).json({ message: 'Token de autenticación inválido' });
  }
};

/**
 * Middleware para verificar roles.
 * @param {Array} roles - Roles permitidos para acceder a la ruta.
 */
const authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.user || (roles.length && !roles.includes(req.user.role))) {
      return res.status(403).json({ message: 'No tiene permisos para realizar esta acción' });
    }
    next();
  };
};

module.exports = {
  verifyToken,
  authorize
};
