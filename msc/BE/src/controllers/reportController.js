const { Report, Location, IncidentType, User, sequelize } = require('../models');
const { Op } = require('sequelize');
const cloudinary = require('../config/cloudinary');

/**
 * Obtiene todos los reportes, con soporte opcional para filtros, búsqueda por texto y ordenamiento.
 * 
 * Funcionalidades Avanzadas Soportadas:
 * - Filtro por estado: ?status=Pendiente
 * - Filtro por tipo: ?tipo=Robo
 * - Búsqueda por texto (en descripción): ?search=auto
 * - Ordenamiento dinámico: ?sortBy=date&order=DESC
 * 
 * @param {Object} req - Petición HTTP Express
 * @param {Object} res - Respuesta HTTP Express
 */
exports.getAll = async (req, res) => {
    try {
        // Limpieza automática: Borrar reportes de más de 7 días (168 horas)
        const sieteDiasAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        await Report.destroy({
            where: {
                date: {
                    [Op.lt]: sieteDiasAtras
                }
            }
        });

        const { status, tipo, distrito, search, sortBy, order } = req.query;

        // Construir condiciones de búsqueda para el Reporte (Filtros y Búsqueda por texto)
        const reportWhere = {};

        if (status) {
            reportWhere.status = status;
        }

        if (search) {
            reportWhere.description = {
                [Op.like]: `%${search}%`
            };
        }

        // Construir condiciones para el Tipo de Incidente
        const typeWhere = {};
        if (tipo) {
            typeWhere.name = tipo;
        }

        // Construir configuración de ordenamiento dinámico
        let orderArray = [['date', 'DESC']]; // Orden por defecto
        if (sortBy) {
            const validSortFields = ['date', 'status', 'createdAt', 'updatedAt'];
            if (validSortFields.includes(sortBy)) {
                const sortOrder = (order && order.toUpperCase() === 'ASC') ? 'ASC' : 'DESC';
                orderArray = [[sortBy, sortOrder]];
            }
        }

        // Paginación
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 1000;
        const offset = (page - 1) * limit;

        const { count, rows } = await Report.findAndCountAll({
            where: reportWhere,
            order: orderArray,
            limit,
            offset,
            distinct: true,
            subQuery: false,
            include: [
                {
                    model: Location,
                    as: 'location',
                    where: distrito ? { district: distrito } : undefined
                },
                {
                    model: IncidentType,
                    as: 'incidentType',
                    where: Object.keys(typeWhere).length > 0 ? typeWhere : undefined
                },
                { model: User, as: 'creator' }
            ]
        });
        // Mapeo al formato plano del FE
        const mappedReports = rows.map(r => {
            const tipo = r.incidentType ? r.incidentType.name : 'Desconocido';
            const desc = r.description || '';
            const isEmergency = tipo.toUpperCase().includes('EMERG') ||
                tipo.toUpperCase().includes('SOS') ||
                desc.toUpperCase().includes('SOS');

            return {
                id: r.id,
                tipo: tipo,
                descripcion: desc,
                distrito: r.location ? r.location.district : '',
                barrio: r.location ? r.location.neighborhood : '',
                direccion_exacta: r.location ? r.location.exactAddress : '',
                fecha: r.date,
                id_creador: r.userId,
                nombre_creador: r.creator ? r.creator.fullName : 'Anónimo',
                estado: r.status,
                lat: r.location ? r.location.lat : null,
                lng: r.location ? r.location.lng : null,
                imageUrl: r.imageUrl || null,
                isEmergency: isEmergency
            };
        });

        res.status(200).json({
            status: 'success',
            data: mappedReports,
            meta: {
                total: count,
                page: page,
                limit: limit,
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.create = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        // Datos del FE: { tipo, descripcion, distrito, barrio, direccion_exacta, fecha, id_creador, estado, lat, lng, imageUrl }
        const { tipo, descripcion, distrito, barrio, direccion_exacta, fecha, id_creador, estado, lat, lng, imageUrl } = req.body;

        // 1. Buscar o crear IncidentType
        let incidentType = await IncidentType.findOne({ where: { name: tipo } }, { transaction: t });
        if (!incidentType) {
            incidentType = await IncidentType.create({ name: tipo, severity: 'Media' }, { transaction: t });
        }

        // 2. Crear Location
        const location = await Location.create({
            district: distrito,
            neighborhood: barrio,
            exactAddress: direccion_exacta,
            lat: lat,
            lng: lng
        }, { transaction: t });

        // 3. Crear Report
        const report = await Report.create({
            description: descripcion,
            date: fecha || new Date(),
            status: estado || 'Pendiente',
            userId: id_creador,
            incidentTypeId: incidentType.id,
            locationId: location.id,
            imageUrl: imageUrl || null
        }, { transaction: t });

        await t.commit();

        // Preparar respuesta con bandera de emergencia
        const responseData = {
            ...report.toJSON(),
            tipo: tipo,
            descripcion: descripcion,
            isEmergency: tipo.toUpperCase().includes('SOS') || tipo.toUpperCase().includes('EMERG') || descripcion.toUpperCase().includes('SOS')
        };

        res.status(201).json({ status: 'success', data: responseData });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const report = await Report.findByPk(req.params.id, {
            include: [
                { model: Location, as: 'location' },
                { model: IncidentType, as: 'incidentType' },
                { model: User, as: 'creator' }
            ]
        });
        if (!report) return res.status(404).json({ status: 'error', message: 'Not found' });

        // Permite actualizar solo el estado por ahora
        if (req.body.estado) {
            const currentStatus = report.status || 'Pendiente';
            const newStatus = req.body.estado;

            // Validar transiciones de estado
            const validTransitions = {
                'Pendiente': ['En Proceso'],
                'En Proceso': ['Resuelto'],
                'Resuelto': [] // No se puede cambiar de Resuelto
            };

            const allowed = validTransitions[currentStatus] || [];

            if (allowed.includes(newStatus)) {
                await report.update({ status: newStatus });
            } else if (currentStatus !== newStatus) {
                return res.status(400).json({ status: 'error', message: `Transición de estado no válida: de ${currentStatus} a ${newStatus}` });
            }
        }

        // Mapear al formato del frontend
        const tipo = report.incidentType ? report.incidentType.name : 'Desconocido';
        const desc = report.description || '';
        const isEmergency = tipo.toUpperCase().includes('EMERG') ||
            tipo.toUpperCase().includes('SOS') ||
            desc.toUpperCase().includes('SOS');

        const mappedReport = {
            id: report.id,
            tipo: tipo,
            descripcion: desc,
            distrito: report.location ? report.location.district : '',
            barrio: report.location ? report.location.neighborhood : '',
            direccion_exacta: report.location ? report.location.exactAddress : '',
            fecha: report.date,
            id_creador: report.userId,
            nombre_creador: report.creator ? report.creator.fullName : 'Anónimo',
            estado: report.status,
            lat: report.location ? report.location.lat : null,
            lng: report.location ? report.location.lng : null,
            imageUrl: report.imageUrl || null,
            isEmergency: isEmergency
        };

        res.status(200).json({ status: 'success', data: mappedReport });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const report = await Report.findByPk(req.params.id);
        if (!report) return res.status(404).json({ status: 'error', message: 'Not found' });
        await report.destroy();
        res.status(200).json({ status: 'success', message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.uploadImage = async (req, res) => {
    try {
        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ status: 'error', message: 'Archivo no recibido' });
        }

        const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        
        const uploadResult = await cloudinary.uploader.upload(dataUri, {
            folder: 'reports',
            public_id: `report_${Date.now()}`,
            resource_type: 'image'
        });

        res.status(200).json({ status: 'success', imageUrl: uploadResult.secure_url });
    } catch (error) {
        console.error('Error uploading report image:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};