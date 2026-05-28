const request = require('supertest');
const app = require('../app');
const { User, Role, Report, Location, IncidentType } = require('../models');
const cloudinary = require('../config/cloudinary');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'super_secret_msc_desamparados_2024_key_!!';

jest.mock('../models', () => {
  return {
    User: {
      findByPk: jest.fn()
    },
    Role: {},
    Report: {},
    Location: {},
    IncidentType: {}
  };
});

jest.mock('../config/cloudinary', () => {
  return {
    uploader: {
      upload: jest.fn().mockResolvedValue({ secure_url: 'http://res.cloudinary.com/profile.jpg' })
    }
  };
});

describe('Profile Endpoints', () => {
  let citizenToken;
  let adminToken;

  beforeAll(() => {
    citizenToken = jwt.sign({ id: 1, email: 'citizen@test.com', role: 'ciudadano' }, process.env.JWT_SECRET);
    adminToken = jwt.sign({ id: 2, email: 'admin@test.com', role: 'administrador' }, process.env.JWT_SECRET);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/profile', () => {
    // Testing 1: Obtener la información del perfil del usuario autenticado de forma exitosa.
    it('should return profile data for authenticated user', async () => {
      User.findByPk.mockResolvedValue({
        id: 1,
        fullName: 'Citizen Test',
        email: 'citizen@test.com',
        phone: '12345678',
        nationalId: '1-1234-5678',
        imageUrl: 'http://test.com/photo.jpg',
        role: { name: 'ciudadano' },
        Reports: [
          {
            id: 1,
            description: 'Incident 1',
            date: new Date(),
            status: 'Pendiente',
            incidentType: { name: 'Robo' },
            location: { district: 'Centro', neighborhood: 'Barrio', lat: 9.9, lng: -84.0 }
          }
        ]
      });

      const res = await request(app)
        .get('/api/v1/profile')
        .set('Cookie', [`token=${citizenToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.fullName).toBe('Citizen Test');
      expect(res.body.data.reports).toHaveLength(1);
    });

    // Testing 2: Retornar 404 si el usuario autenticado no existe en la base de datos.
    it('should return 404 if user not found', async () => {
      User.findByPk.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/v1/profile')
        .set('Cookie', [`token=${citizenToken}`]);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/v1/profile', () => {
    // Testing 3: Permitir actualizar los datos del perfil si el usuario tiene el rol de ciudadano.
    it('should allow updates for ciudadanos', async () => {
      const mockUser = {
        id: 1,
        fullName: 'Citizen Test',
        email: 'citizen@test.com',
        phone: '12345678',
        update: jest.fn().mockResolvedValue(true)
      };
      User.findByPk.mockResolvedValue(mockUser);

      const res = await request(app)
        .put('/api/v1/profile')
        .set('Cookie', [`token=${citizenToken}`])
        .send({ fullName: 'Citizen Updated' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Perfil actualizado correctamente');
      expect(mockUser.update).toHaveBeenCalled();
    });

    // Testing 4: Bloquear y retornar 403 si un usuario con rol administrativo o funcionario intenta actualizar sus datos desde esta vista.
    it('should block updates for non-ciudadano users (admin/funcionario)', async () => {
      const res = await request(app)
        .put('/api/v1/profile')
        .set('Cookie', [`token=${adminToken}`])
        .send({ fullName: 'Admin Updated' });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Los funcionarios y administradores no pueden modificar sus datos');
    });
  });

  describe('PUT /api/v1/profile/photo', () => {
    // Testing 5: Actualizar la URL de la foto de perfil en el registro del usuario.
    it('should update profile photo url', async () => {
      const mockUser = {
        id: 1,
        update: jest.fn().mockResolvedValue(true)
      };
      User.findByPk.mockResolvedValue(mockUser);

      const res = await request(app)
        .put('/api/v1/profile/photo')
        .set('Cookie', [`token=${citizenToken}`])
        .send({ profilePhoto: 'http://newphoto.com/photo.jpg' });

      expect(res.status).toBe(200);
      expect(res.body.photoUrl).toBe('http://newphoto.com/photo.jpg');
      expect(mockUser.update).toHaveBeenCalledWith({ imageUrl: 'http://newphoto.com/photo.jpg' });
    });
  });

  describe('POST /api/v1/profile/photo/upload', () => {
    // Testing 6: Subir la foto de perfil del usuario a Cloudinary y actualizar su registro en la BD.
    it('should upload profile photo via Cloudinary', async () => {
      const mockUser = {
        id: 1,
        update: jest.fn().mockResolvedValue(true)
      };
      User.findByPk.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/v1/profile/photo/upload')
        .set('Cookie', [`token=${citizenToken}`])
        .attach('avatar', Buffer.from('mockAvatarData'), 'avatar.png');

      expect(res.status).toBe(200);
      expect(res.body.photoUrl).toBe('http://res.cloudinary.com/profile.jpg');
      expect(mockUser.update).toHaveBeenCalledWith({ imageUrl: 'http://res.cloudinary.com/profile.jpg' });
    });
  });

  describe('PUT /api/v1/profile/password', () => {
    // Testing 7: Cambiar la contraseña del usuario autenticado si la contraseña actual es correcta y la nueva es fuerte.
    it('should change password with valid current and new password', async () => {
      const mockUser = {
        id: 1,
        validatePassword: jest.fn().mockResolvedValue(true),
        update: jest.fn().mockResolvedValue(true)
      };
      User.findByPk.mockResolvedValue(mockUser);

      const res = await request(app)
        .put('/api/v1/profile/password')
        .set('Cookie', [`token=${citizenToken}`])
        .send({
          currentPassword: 'Password1',
          newPassword: 'NewPassword2'
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Contraseña actualizada correctamente.');
      expect(mockUser.validatePassword).toHaveBeenCalledWith('Password1');
      expect(mockUser.update).toHaveBeenCalledWith({ password: 'NewPassword2' });
    });

    // Testing 8: Rechazar la actualización si la nueva contraseña no cumple los requisitos de complejidad.
    it('should reject weak new password', async () => {
      const res = await request(app)
        .put('/api/v1/profile/password')
        .set('Cookie', [`token=${citizenToken}`])
        .send({
          currentPassword: 'Password1',
          newPassword: 'weak'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('La nueva contraseña debe tener al menos 6 caracteres');
    });
  });
});
