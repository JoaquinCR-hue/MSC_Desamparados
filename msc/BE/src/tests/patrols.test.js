const request = require('supertest');
const app = require('../app');
const { Patrol } = require('../models');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'super_secret_msc_desamparados_2024_key_!!';

jest.mock('../models', () => {
  return {
    Patrol: {
      findAll: jest.fn(),
      create: jest.fn(),
      findByPk: jest.fn()
    }
  };
});

describe('Patrols Endpoints', () => {
  let authorizedToken;
  let citizenToken;

  beforeAll(() => {
    authorizedToken = jwt.sign({ id: 1, email: 'officer@test.com', role: 'funcionario' }, process.env.JWT_SECRET);
    citizenToken = jwt.sign({ id: 2, email: 'citizen@test.com', role: 'ciudadano' }, process.env.JWT_SECRET);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/patrols/getAllPatrols', () => {
    // Testing 1: Obtener todas las patrullas activas para usuarios autorizados (administradores/funcionarios).
    it('should return all patrols for authorized roles', async () => {
      Patrol.findAll.mockResolvedValue([
        {
          id: 1,
          officerNames: 'Officer A, Officer B',
          unit: 'P-101',
          status: 'Activa',
          zone: 'Centro',
          unitType: 'Patrulla',
          schedule: '06:00 - 18:00',
          lat: 9.9,
          lng: -84.0
        }
      ]);

      const res = await request(app)
        .get('/api/v1/patrols/getAllPatrols')
        .set('Cookie', [`token=${authorizedToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].unidad).toBe('P-101');
    });

    // Testing 2: Denegar el acceso y retornar 403 para usuarios no autorizados (ciudadanos).
    it('should block unauthorized roles', async () => {
      const res = await request(app)
        .get('/api/v1/patrols/getAllPatrols')
        .set('Cookie', [`token=${citizenToken}`]);

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/v1/patrols/createPatrol', () => {
    // Testing 3: Crear un nuevo registro de patrulla asignada exitosamente.
    it('should create a patrol successfully', async () => {
      Patrol.create.mockResolvedValue({
        id: 1,
        officerNames: 'Officer A, Officer B',
        unit: 'P-101',
        status: 'Activa',
        zone: 'Centro',
        unitType: 'Patrulla',
        schedule: '06:00 - 18:00',
        lat: 9.9,
        lng: -84.0
      });

      const res = await request(app)
        .post('/api/v1/patrols/createPatrol')
        .set('Cookie', [`token=${authorizedToken}`])
        .send({
          nombre_oficiales: 'Officer A, Officer B',
          unidad: 'P-101',
          estado: 'Activa',
          zona: 'Centro',
          tipo_unidad: 'Patrulla',
          horario: '06:00 - 18:00',
          lat: 9.9,
          lng: -84.0
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.unit).toBe('P-101');
    });
  });

  describe('PUT /api/v1/patrols/updatePatrol/:id', () => {
    // Testing 4: Actualizar la información (estado, oficiales asignados, etc.) de una patrulla existente.
    it('should update patrol details', async () => {
      const mockPatrol = {
        id: 1,
        update: jest.fn().mockResolvedValue(true)
      };
      Patrol.findByPk.mockResolvedValue(mockPatrol);

      const res = await request(app)
        .put('/api/v1/patrols/updatePatrol/1')
        .set('Cookie', [`token=${authorizedToken}`])
        .send({
          nombre_oficiales: 'Officer A',
          estado: 'Inactiva'
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(mockPatrol.update).toHaveBeenCalled();
    });

    // Testing 5: Retornar 404 si se intenta actualizar una patrulla que no existe en el sistema.
    it('should return 404 if patrol not found', async () => {
      Patrol.findByPk.mockResolvedValue(null);

      const res = await request(app)
        .put('/api/v1/patrols/updatePatrol/999')
        .set('Cookie', [`token=${authorizedToken}`])
        .send({
          estado: 'Inactiva'
        });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/patrols/deletePatrol/:id', () => {
    // Testing 6: Eliminar o retirar una patrulla operativa exitosamente.
    it('should delete patrol successfully', async () => {
      const mockPatrol = {
        id: 1,
        destroy: jest.fn().mockResolvedValue(true)
      };
      Patrol.findByPk.mockResolvedValue(mockPatrol);

      const res = await request(app)
        .delete('/api/v1/patrols/deletePatrol/1')
        .set('Cookie', [`token=${authorizedToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(mockPatrol.destroy).toHaveBeenCalled();
    });
  });
});
