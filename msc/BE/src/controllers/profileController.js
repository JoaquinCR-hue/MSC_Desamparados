const { User, Role, Report, Location, IncidentType } = require('../models');
const cloudinary = require('../config/cloudinary');

// Obtener perfil del usuario autenticado
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            include: [
                { model: Role, as: 'role' },
                { 
                    model: Report, 
                    include: [
                        { model: Location, as: 'location' },
                        { model: IncidentType, as: 'incidentType' }
                    ]
                }
            ]
        });

        if (!user) return res.status(404).json({ status: 'error', message: 'Usuario no encontrado' });

        // Mapear usuario para el frontend
        const roleName = user.role ? user.role.name : 'ciudadano';
        
        // Mapear reportes del usuario
        const mappedReports = (user.Reports || []).map(r => {
            const tipo = r.incidentType ? r.incidentType.name : 'Desconocido';
            return {
                id: r.id,
                tipo: tipo,
                descripcion: r.description,
                distrito: r.location ? r.location.district : '',
                barrio: r.location ? r.location.neighborhood : '',
                fecha: r.date,
                estado: r.status,
                lat: r.location ? r.location.lat : null,
                lng: r.location ? r.location.lng : null
            };
        });

        res.status(200).json({ 
            status: 'success', 
            data: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                nationalId: user.nationalId,
                profilePhoto: user.imageUrl,
                role: roleName,
                reports: mappedReports
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Actualizar datos del perfil (solo para ciudadanos)
exports.updateProfile = async (req, res) => {
    try {
        // req.user.role viene del token
        if (req.user.role !== 'ciudadano') {
            return res.status(403).json({ status: 'error', message: 'Los funcionarios y administradores no pueden modificar sus datos desde esta vista.' });
        }

        const { fullName, email, phone } = req.body;
        const user = await User.findByPk(req.user.id);
        
        if (!user) return res.status(404).json({ status: 'error', message: 'Usuario no encontrado' });

        await user.update({
            fullName: fullName || user.fullName,
            email: email || user.email,
            phone: phone || user.phone
        });

        res.status(200).json({ status: 'success', message: 'Perfil actualizado correctamente' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Actualizar solo la foto de perfil (para todos los roles)
exports.updateProfilePhoto = async (req, res) => {
    try {
        const { profilePhoto } = req.body;
        if (!profilePhoto) {
            return res.status(400).json({ status: 'error', message: 'URL de foto requerida' });
        }

        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ status: 'error', message: 'Usuario no encontrado' });

        await user.update({ imageUrl: profilePhoto });

        res.status(200).json({ status: 'success', message: 'Foto actualizada correctamente', photoUrl: profilePhoto });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Subida de foto vía backend a Cloudinary y actualización del usuario
exports.uploadProfilePhoto = async (req, res) => {
    try {
        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ status: 'error', message: 'Archivo no recibido' });
        }

        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ status: 'error', message: 'Usuario no encontrado' });

        // Convertir buffer a Data URI
        const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

        const uploadResult = await cloudinary.uploader.upload(dataUri, {
            folder: 'profiles',
            public_id: `user_${user.id}_${Date.now()}`,
            overwrite: true,
            resource_type: 'image'
        });

        await user.update({ imageUrl: uploadResult.secure_url });

        res.status(200).json({ status: 'success', message: 'Foto subida y actualizada', photoUrl: uploadResult.secure_url });
    } catch (error) {
        console.error('Error uploading profile photo:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Cambiar la contraseña del usuario autenticado
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ status: 'error', message: 'Faltan datos requeridos.' });
        }
        
        if (!regex.test(newPassword)) {
            return res.status(400).json({ 
                status: 'error',
                message: 'La nueva contraseña debe tener al menos 6 caracteres, incluyendo una mayúscula, una minúscula y un número.' 
            });
        }

        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ status: 'error', message: 'Usuario no encontrado.' });

        const isMatch = await user.validatePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ status: 'error', message: 'La contraseña actual es incorrecta.' });
        }

        // El hook beforeUpdate se encargará de hashear la nueva contraseña
        await user.update({ password: newPassword });

        res.status(200).json({ status: 'success', message: 'Contraseña actualizada correctamente.' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
