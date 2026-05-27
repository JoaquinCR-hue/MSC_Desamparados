const request = require('supertest');
const app = require('../app');
const { Report, Location, IncidentType, User, sequelize } = require('../models');
const cloudinary = require('../config/cloudinary');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'super_secret_msc_desamparados_2024_key_!!';

const mockTransaction = {
  commit: jest.fn().mockResolvedValue(true),
  rollback: jest.fn().mockResolvedValue(true)
};

jest.mock('../models', () => {
  return {
    Report: {
      destroy: jest.fn(),
      findAndCountAll: jest.fn(),
      findByPk: jest.fn(),
      create: jest.fn()
    },
    Location: {
      create: jest.fn()
    },
    IncidentType: {
      findOne: jest.fn(),
      create: jest.fn()
    },
    User: {
      findByPk: jest.fn()
    },
    sequelize: {
      transaction: jest.fn(() => Promise.resolve(mockTransaction))
    }
  };
});

jest.mock('../config/cloudinary', () => {
  return {
    uploader: {
      upload: jest.fn().mockResolvedValue({ secure_url: 'http://res.cloudinary.com/test.jpg' })
    }
  };
});

describe('Reports Endpoints', () => {
  let userToken;

  beforeAll(() => {
    userToken = jwt.sign({ id: 1, email: 'citizen@test.com', role: 'ciudadano' }, process.env.JWT_SECRET);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/reports', () => {
    // Testing 1: Obtener todos los reportes de incidentes de forma exitosa (limpiando previamente reportes antiguos).
    it('should return all reports successfully', async () => {
      Report.destroy.mockResolvedValue(0);
      Report.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: [
          {
            id: 1,
            description: 'Incident 1',
            date: new Date(),
            status: 'Pendiente',
            userId: 1,
            incidentType: { id: 1, name: 'Robo' },
            location: { id: 1, district: 'Centro', neighborhood: 'Barrio', exactAddress: 'Calle 1', lat: 9.9, lng: -84.0 },
            creator: { id: 1, fullName: 'Citizen Test' }
          }
        ]
      });

      const res = await request(app)
        .get('/api/v1/reports')
        .set('Cookie', [`token=${userToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].tipo).toBe('Robo');
    });
  });

  describe('POST /api/v1/reports', () => {
    // Testing 2: Crear un nuevo reporte exitosamente asociándole la ubicación y el tipo de incidente dentro de una transacción.
    it('should create a report successfully within a transaction', async () => {
      IncidentType.findOne.mockResolvedValue({ id: 1, name: 'Robo' });
      Location.create.mockResolvedValue({ id: 1 });
      Report.create.mockResolvedValue({
        id: 1,
        description: 'New Report Description',
        date: new Date(),
        status: 'Pendiente',
        userId: 1,
        incidentTypeId: 1,
        locationId: 1,
        toJSON: function() { return this; }
      });

      const res = await request(app)
        .post('/api/v1/reports')
        .set('Cookie', [`token=${userToken}`])
        .send({
          tipo: 'Robo',
          descripcion: 'New Report Description',
          distrito: 'Centro',
          barrio: 'Barrio',
          direccion_exacta: 'Calle 1',
          lat: 9.9,
          lng: -84.0,
          id_creador: 1
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.descripcion).toBe('New Report Description');
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    // Testing 3: Hacer rollback de la transacción si ocurre un error inesperado al intentar crear el reporte.
    it('should rollback transaction on error', async () => {
      IncidentType.findOne.mockRejectedValue(new Error('DB Error'));

      const res = await request(app)
        .post('/api/v1/reports')
        .set('Cookie', [`token=${userToken}`])
        .send({
          tipo: 'Robo',
          descripcion: 'New Report Description',
          distrito: 'Centro',
          barrio: 'Barrio',
          direccion_exacta: 'Calle 1',
          lat: 9.9,
          lng: -84.0,
          id_creador: 1
        });

      expect(res.status).toBe(500);
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe('PUT /api/v1/reports/:id', () => {
    // Testing 4: Actualizar el estado de un reporte de forma exitosa (ej: de Pendiente a En Proceso).
    it('should update report status successfully', async () => {
      const mockReport = {
        id: 1,
        status: 'Pendiente',
        description: 'Description',
        incidentType: { name: 'Robo' },
        update: jest.fn().mockResolvedValue(true)
      };
      Report.findByPk.mockResolvedValue(mockReport);

      const res = await request(app)
        .put('/api/v1/reports/1')
        .set('Cookie', [`token=${userToken}`])
        .send({ estado: 'En Proceso' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(mockReport.update).toHaveBeenCalledWith({ status: 'En Proceso' });
    });

    // Testing 5: Retornar un error 400 si se intenta realizar una transición de estado no válida.
    it('should return 400 for invalid status transition', async () => {
      const mockReport = {
        id: 1,
        status: 'Resuelto',
        update: jest.fn()
      };
      Report.findByPk.mockResolvedValue(mockReport);

      const res = await request(app)
        .put('/api/v1/reports/1')
        .set('Cookie', [`token=${userToken}`])
        .send({ estado: 'En Proceso' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Transición de estado no válida');
    });
  });

  describe('DELETE /api/v1/reports/:id', () => {
    // Testing 6: Eliminar un reporte existente de forma exitosa.
    it('should delete report successfully', async () => {
      const mockReport = {
        id: 1,
        destroy: jest.fn().mockResolvedValue(true)
      };
      Report.findByPk.mockResolvedValue(mockReport);

      const res = await request(app)
        .delete('/api/v1/reports/1')
        .set('Cookie', [`token=${userToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(mockReport.destroy).toHaveBeenCalled();
    });
  });

  describe('POST /api/v1/reports/upload', () => {
    // Testing 7: Subir una imagen de evidencia a Cloudinary de manera exitosa.
    it('should upload image successfully', async () => {
      const res = await request(app)
        .post('/api/v1/reports/upload')
        .set('Cookie', [`token=${userToken}`])
        .attach('image', Buffer.from('mockImageContent'), 'test.png');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.imageUrl).toBe('http://res.cloudinary.com/test.jpg');
    });
  });
});
