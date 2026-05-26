const request = require('supertest');
const app = require('../app');
const { Consult } = require('../models');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'super_secret_msc_desamparados_2024_key_!!';

jest.mock('../models', () => {
  return {
    Consult: {
      findAll: jest.fn(),
      create: jest.fn(),
      findByPk: jest.fn()
    }
  };
});

describe('Consults Endpoints', () => {
  let userToken;

  beforeAll(() => {
    userToken = jwt.sign({ id: 1, email: 'citizen@test.com', role: 'ciudadano' }, process.env.JWT_SECRET);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/consults/getAllConsults', () => {
    // Testing 1: Obtener todas las consultas registradas en el sistema.
    it('should return all consults', async () => {
      Consult.findAll.mockResolvedValue([
        {
          id: 1,
          nationalId: '123456789',
          fullName: 'Consultant Test',
          email: 'consult@test.com',
          phone: '12345678',
          consultType: 'Denuncia',
          description: 'Consult Description',
          date: new Date(),
          status: 'Pendiente'
        }
      ]);

      const res = await request(app)
        .get('/api/v1/consults/getAllConsults')
        .set('Cookie', [`token=${userToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].fullName).toBe('Consultant Test');
    });
  });

  describe('POST /api/v1/consults/createConsult', () => {
    // Testing 2: Crear una nueva consulta ciudadana exitosamente.
    it('should create a consult successfully', async () => {
      Consult.create.mockResolvedValue({
        id: 1,
        nationalId: '123456789',
        fullName: 'Consultant Test',
        email: 'consult@test.com',
        phone: '12345678',
        consultType: 'Denuncia',
        description: 'Consult Description',
        date: new Date(),
        status: 'Pendiente'
      });

      const res = await request(app)
        .post('/api/v1/consults/createConsult')
        .set('Cookie', [`token=${userToken}`])
        .send({
          cedula: '123456789',
          nombreCompleto: 'Consultant Test',
          correo: 'consult@test.com',
          telefono: '12345678',
          tipoConsulta: 'Denuncia',
          descripcion: 'Consult Description'
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.fullName).toBe('Consultant Test');
    });
  });

  describe('PUT /api/v1/consults/updateConsult/:id', () => {
    // Testing 3: Actualizar el estado y la respuesta de una consulta existente.
    it('should update consult status and response', async () => {
      const mockConsult = {
        id: 1,
        update: jest.fn().mockResolvedValue(true)
      };
      Consult.findByPk.mockResolvedValue(mockConsult);

      const res = await request(app)
        .put('/api/v1/consults/updateConsult/1')
        .set('Cookie', [`token=${userToken}`])
        .send({
          estado: 'Resuelto',
          respuesta: 'Respuesta de prueba',
          fechaRespuesta: new Date()
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(mockConsult.update).toHaveBeenCalled();
    });

    // Testing 4: Intentar actualizar una consulta que no existe y retornar 404.
    it('should return 404 if consult does not exist', async () => {
      Consult.findByPk.mockResolvedValue(null);

      const res = await request(app)
        .put('/api/v1/consults/updateConsult/999')
        .set('Cookie', [`token=${userToken}`])
        .send({
          estado: 'Resuelto'
        });

      expect(res.status).toBe(404);
    });
  });
});
