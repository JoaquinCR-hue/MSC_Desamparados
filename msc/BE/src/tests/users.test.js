const request = require('supertest');
const app = require('../app');
const { User, Role } = require('../models');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'super_secret_msc_desamparados_2024_key_!!';

jest.mock('../models', () => {
  return {
    User: {
      findAndCountAll: jest.fn(),
      findByPk: jest.fn(),
      create: jest.fn()
    },
    Role: {
      findByPk: jest.fn(),
      create: jest.fn()
    }
  };
});

describe('Users Endpoints', () => {
  let adminToken;
  let unauthorizedToken;

  beforeAll(() => {
    adminToken = jwt.sign({ id: 1, email: 'admin@test.com', role: 'administrador' }, process.env.JWT_SECRET);
    unauthorizedToken = jwt.sign({ id: 2, email: 'citizen@test.com', role: 'ciudadano' }, process.env.JWT_SECRET);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/users', () => {
    // Testing 1: Obtener la lista completa de usuarios si se cuenta con el rol de administrador.
    it('should return all users for administrator', async () => {
      User.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: [
          {
            id: 1,
            email: 'admin@test.com',
            fullName: 'Admin Test',
            phone: '12345678',
            nationalId: '1-1234-5678',
            roleId: 1,
            role: { id: 1, name: 'administrador' }
          }
        ]
      });

      const res = await request(app)
        .get('/api/v1/users')
        .set('Cookie', [`token=${adminToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].email).toBe('admin@test.com');
    });

    // Testing 2: Retornar un error 403 (Forbidden) para usuarios no administradores que intentan listar usuarios.
    it('should block non-administrator users', async () => {
      const res = await request(app)
        .get('/api/v1/users')
        .set('Cookie', [`token=${unauthorizedToken}`]);

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/v1/users', () => {
    // Testing 3: Crear un nuevo usuario exitosamente cuando la petición es realizada por un administrador.
    it('should create a new user when request comes from admin', async () => {
      Role.findByPk.mockResolvedValue({ id: 2, name: 'funcionario' });
      User.create.mockResolvedValue({
        id: 3,
        email: 'officer@test.com',
        fullName: 'Officer Test',
        phone: '87654321',
        nationalId: '2-1234-5678',
        roleId: 2
      });

      const res = await request(app)
        .post('/api/v1/users')
        .set('Cookie', [`token=${adminToken}`])
        .send({
          email: 'officer@test.com',
          pass: 'Password123',
          nombre: 'Officer Test',
          telefono: '87654321',
          role: 'funcionario',
          cedula: '2-1234-5678'
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.email).toBe('officer@test.com');
    });
  });

  describe('PUT /api/v1/users/:id', () => {
    // Testing 4: Actualizar la información de un usuario existente de manera exitosa.
    it('should update user successfully', async () => {
      const mockUserInstance = {
        id: 3,
        email: 'officer@test.com',
        fullName: 'Officer Test',
        update: jest.fn().mockResolvedValue(true)
      };
      User.findByPk.mockResolvedValue(mockUserInstance);

      const res = await request(app)
        .put('/api/v1/users/3')
        .set('Cookie', [`token=${adminToken}`])
        .send({
          nombre: 'Officer Updated'
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(mockUserInstance.update).toHaveBeenCalled();
    });

    // Testing 5: Retornar un error 404 si se intenta actualizar un usuario inexistente.
    it('should return 404 if user not found', async () => {
      User.findByPk.mockResolvedValue(null);

      const res = await request(app)
        .put('/api/v1/users/999')
        .set('Cookie', [`token=${adminToken}`])
        .send({
          nombre: 'Not Found'
        });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    // Testing 6: Eliminar un usuario del sistema exitosamente.
    it('should delete user successfully', async () => {
      const mockUserInstance = {
        id: 3,
        destroy: jest.fn().mockResolvedValue(true)
      };
      User.findByPk.mockResolvedValue(mockUserInstance);

      const res = await request(app)
        .delete('/api/v1/users/3')
        .set('Cookie', [`token=${adminToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(mockUserInstance.destroy).toHaveBeenCalled();
    });
  });
});
