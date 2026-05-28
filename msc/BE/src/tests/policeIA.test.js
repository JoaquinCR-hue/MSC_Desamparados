const request = require('supertest');
const app = require('../app');
const { Report, Location, IncidentType, sequelize } = require('../models');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'super_secret_msc_desamparados_2024_key_!!';
process.env.GEMINI_API_KEY = 'mock_gemini_key';

const mockTransaction = {
  commit: jest.fn().mockResolvedValue(true),
  rollback: jest.fn().mockResolvedValue(true)
};

jest.mock('../models', () => {
  return {
    Report: {
      create: jest.fn()
    },
    Location: {
      create: jest.fn()
    },
    IncidentType: {
      findOne: jest.fn(),
      create: jest.fn()
    },
    sequelize: {
      query: jest.fn(),
      transaction: jest.fn(() => Promise.resolve(mockTransaction)),
      QueryTypes: { SELECT: 'SELECT' }
    }
  };
});

describe('Police-IA Endpoints', () => {
  let userToken;

  beforeAll(() => {
    userToken = jwt.sign({ id: 1, email: 'citizen@test.com', role: 'ciudadano' }, process.env.JWT_SECRET);
    global.fetch = jest.fn();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/police-ia/chat', () => {
    // Testing 1: Obtener la respuesta en texto generada por Gemini API de forma exitosa.
    it('should return Gemini text response on success', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          candidates: [
            {
              content: {
                parts: [
                  { text: 'Respuesta simulada de Gemini' }
                ]
              }
            }
          ]
        })
      });

      const res = await request(app)
        .post('/api/v1/police-ia/chat')
        .set('Cookie', [`token=${userToken}`])
        .send({
          system: 'Instrucciones del sistema',
          messages: [{ role: 'user', content: 'Hola' }]
        });

      expect(res.status).toBe(200);
      expect(res.body.text).toBe('Respuesta simulada de Gemini');
      expect(res.body.isFallback).toBeUndefined();
    });

    // Testing 2: Activar la respuesta de respaldo local (fallback) si la API de Gemini falla (retorna 500 u otros errores).
    it('should trigger local fallback response when Gemini API fails', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: { message: 'Internal Error' } })
      });

      const res = await request(app)
        .post('/api/v1/police-ia/chat')
        .set('Cookie', [`token=${userToken}`])
        .send({
          system: 'Instrucciones del sistema',
          messages: [{ role: 'user', content: 'Hola' }]
        });

      expect(res.status).toBe(200);
      expect(res.body.isFallback).toBe(true);
      expect(res.body.text).toContain('Police-IA de respaldo');
    });
  });

  describe('GET /api/v1/police-ia/incidents-nearby', () => {
    // Testing 3: Consultar y listar los incidentes cercanos dentro de un radio geográfico específico usando SQL raw.
    it('should return nearby incidents from raw query', async () => {
      sequelize.query.mockResolvedValue([
        {
          id: 1,
          description: 'Robo de vehiculo',
          date: new Date(),
          status: 'Pendiente',
          lat: '9.89',
          lng: '-84.05',
          district: 'Centro',
          neighborhood: 'Barrio A',
          street: 'Calle Principal',
          tipo: 'Robo',
          severity: 'alta',
          distancia_metros: 120
        }
      ]);

      const res = await request(app)
        .get('/api/v1/police-ia/incidents-nearby')
        .set('Cookie', [`token=${userToken}`])
        .query({
          lat: 9.892,
          lng: -84.05,
          radius: 500
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].tipo).toBe('Robo');
      expect(res.body[0].distancia_metros).toBe(120);
    });

    // Testing 4: Retornar 400 si faltan las coordenadas requeridas (latitud/longitud) para calcular incidentes cercanos.
    it('should return 400 when coordinates are missing', async () => {
      const res = await request(app)
        .get('/api/v1/police-ia/incidents-nearby')
        .set('Cookie', [`token=${userToken}`]);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Parámetros requeridos: lat, lng');
    });
  });

  describe('POST /api/v1/police-ia/report', () => {
    // Testing 5: Crear un reporte de incidente reportado por IA exitosamente bajo una transacción.
    it('should create an incident report successfully', async () => {
      Location.create.mockResolvedValue({ id: 10 });
      IncidentType.findOne.mockResolvedValue({ id: 5, name: 'Robo' });
      Report.create.mockResolvedValue({ id: 50 });

      const res = await request(app)
        .post('/api/v1/police-ia/report')
        .set('Cookie', [`token=${userToken}`])
        .send({
          tipo: 'Robo',
          descripcion: 'Robaron un local comercial',
          lat: 9.892,
          lng: -84.05,
          usuarioId: 1
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.reportId).toBe(50);
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    // Testing 6: Retornar 400 cuando faltan parámetros clave al reportar un incidente vía IA.
    it('should return 400 when parameters are missing', async () => {
      const res = await request(app)
        .post('/api/v1/police-ia/report')
        .set('Cookie', [`token=${userToken}`])
        .send({
          tipo: 'Robo'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Faltan campos requeridos');
    });
  });
});
