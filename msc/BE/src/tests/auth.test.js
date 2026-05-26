const request = require('supertest');
const app = require('../app');
const { User, Role } = require('../models');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'super_secret_msc_desamparados_2024_key_!!';

jest.mock('../models', () => {
  const mockUserInstance = {
    id: 1,
    fullName: 'Admin Test',
    email: 'admin@test.com',
    password: 'hashedPassword',
    phone: '12345678',
    nationalId: '1-1234-5678',
    roleId: 1,
    role: { id: 1, name: 'administrador' },
    validatePassword: jest.fn().mockResolvedValue(true),
    update: jest.fn().mockResolvedValue(true)
  };

  return {
    User: {
      findOne: jest.fn(),
      create: jest.fn(),
      findByPk: jest.fn()
    },
    Role: {
      findByPk: jest.fn(),
      create: jest.fn()
    },
    sequelize: {
      authenticate: jest.fn(),
      sync: jest.fn()
    }
  };
});

describe('Auth Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/register', () => {
    // Testing 1: Registro exitoso de un nuevo usuario con datos válidos.
    it('should register a new user successfully', async () => {
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({
        id: 1,
        fullName: 'Admin Test',
        email: 'admin@test.com',
        phone: '12345678',
        nationalId: '1-1234-5678',
        roleId: 3
      });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: 'Admin Test',
          email: 'admin@test.com',
          password: 'Password1',
          phone: '12345678',
          nationalId: '1-1234-5678',
          roleId: 3
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe(undefined);
      expect(res.body.message).toBe('Usuario registrado exitosamente');
      expect(res.body.data.email).toBe('admin@test.com');
    });

    // Testing 2: Intento de registro con un correo electrónico que ya existe en el sistema.
    it('should fail if email already exists', async () => {
      User.findOne.mockResolvedValue({ email: 'admin@test.com' });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: 'Admin Test',
          email: 'admin@test.com',
          password: 'Password1',
          phone: '12345678',
          nationalId: '1-1234-5678',
          roleId: 3
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('El correo ya está registrado en el sistema.');
    });

    // Testing 3: Intento de registro con contraseña que no cumple los requerimientos mínimos de seguridad.
    it('should fail if password does not meet requirements', async () => {
      User.findOne.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: 'Admin Test',
          email: 'admin@test.com',
          password: 'pwd',
          phone: '12345678',
          nationalId: '1-1234-5678',
          roleId: 3
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('La contraseña debe tener al menos 6 caracteres');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    // Testing 4: Inicio de sesión exitoso con credenciales correctas.
    it('should login successfully with valid credentials', async () => {
      const mockUserInstance = {
        id: 1,
        fullName: 'Admin Test',
        email: 'admin@test.com',
        password: 'hashedPassword',
        role: { id: 1, name: 'administrador' },
        validatePassword: jest.fn().mockResolvedValue(true)
      };
      User.findOne.mockResolvedValue(mockUserInstance);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'Password1'
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Inicio de sesión exitoso');
      expect(res.body.data.role).toBe('administrador');
      expect(res.header['set-cookie']).toBeDefined();
    });

    // Testing 5: Intento de inicio de sesión con credenciales inválidas.
    it('should fail with invalid credentials', async () => {
      const mockUserInstance = {
        validatePassword: jest.fn().mockResolvedValue(false)
      };
      User.findOne.mockResolvedValue(mockUserInstance);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'WrongPassword'
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Credenciales inválidas');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    // Testing 6: Cierre de sesión exitoso (limpieza de cookie de token).
    it('should clear token cookie on logout', async () => {
      const token = jwt.sign({ id: 1, email: 'admin@test.com', role: 'administrador' }, process.env.JWT_SECRET);
      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Cookie', [`token=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Sesión cerrada exitosamente.');
    });
  });

  describe('POST /api/v1/auth/recover-password', () => {
    // Testing 7: Recuperación exitosa de contraseña si el correo está registrado.
    it('should recover password if user exists', async () => {
      const mockUserInstance = {
        email: 'admin@test.com',
        update: jest.fn().mockResolvedValue(true)
      };
      User.findOne.mockResolvedValue(mockUserInstance);

      const res = await request(app)
        .post('/api/v1/auth/recover-password')
        .send({ email: 'admin@test.com' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Contraseña recuperada exitosamente');
      expect(res.body.newPassword).toBeDefined();
      expect(mockUserInstance.update).toHaveBeenCalled();
    });

    // Testing 8: Intento de recuperación de contraseña para un correo no registrado.
    it('should return 404 if email not registered', async () => {
      User.findOne.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/auth/recover-password')
        .send({ email: 'unknown@test.com' });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Ese correo no está registrado');
    });
  });

  describe('GET /api/v1/auth/check-status', () => {
    // Testing 9: Retornar los datos del usuario autenticado si el token en la cookie es válido.
    it('should return user info if token is valid', async () => {
      const token = jwt.sign({ id: 1, email: 'admin@test.com', role: 'administrador' }, process.env.JWT_SECRET);
      const res = await request(app)
        .get('/api/v1/auth/check-status')
        .set('Cookie', [`token=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Usuario en línea');
      expect(res.body.user.email).toBe('admin@test.com');
    });

    // Testing 10: Retornar un error 401 si no se provee un token de autenticación.
    it('should return 401 if token is not provided', async () => {
      const res = await request(app).get('/api/v1/auth/check-status');
      expect(res.status).toBe(401);
    });
  });
});
