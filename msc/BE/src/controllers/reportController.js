const { Report, Location, IncidentType, User, sequelize } = require('../models');
const { Op } = require('sequelize');

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
        const { status, tipo, search, sortBy, order } = req.query;

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
        let orderArray = [['createdAt', 'DESC']]; // Orden por defecto
        if (sortBy) {
            const validSortFields = ['date', 'status', 'createdAt', 'updatedAt'];
            if (validSortFields.includes(sortBy)) {
                const sortOrder = (order && order.toUpperCase() === 'ASC') ? 'ASC' : 'DESC';
                orderArray = [[sortBy, sortOrder]];
            }
        }

        // Ejecutar la consulta con Sequelize usando las condiciones construidas
        const reports = await Report.findAll({
            where: reportWhere,
            order: orderArray,
            include: [
                { model: Location, as: 'location' },
                { 
                    model: IncidentType, 
                    as: 'incidentType',
                    where: Object.keys(typeWhere).length > 0 ? typeWhere : undefined
                },
                { model: User, as: 'creator' }
            ]
        });

        // Mapeo al formato plano que espera el Frontend
        const mappedReports = reports.map(r => ({
            id: r.id,
            tipo: r.incidentType ? r.incidentType.name : 'Desconocido',
            descripcion: r.description,
            distrito: r.location ? r.location.district : '',
            barrio: r.location ? r.location.neighborhood : '',
            direccion_exacta: r.location ? r.location.exactAddress : '',
            fecha: r.date,
            id_creador: r.userId,
            nombre_creador: r.creator ? r.creator.fullName : 'Anónimo',
            estado: r.status,
            lat: r.location ? r.location.lat : null,
            lng: r.location ? r.location.lng : null
        }));

        res.status(200).json(mappedReports); 
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.create = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        // Datos del FE: { tipo, descripcion, distrito, barrio, direccion_exacta, fecha, id_creador, estado, lat, lng }
        const { tipo, descripcion, distrito, barrio, direccion_exacta, fecha, id_creador, estado, lat, lng } = req.body;

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
            locationId: location.id
        }, { transaction: t });

        await t.commit();
        res.status(201).json({ status: 'success', data: report });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const report = await Report.findByPk(req.params.id);
        if (!report) return res.status(404).json({ status: 'error', message: 'Not found' });
        // Permite actualizar solo el estado por ahora
        if (req.body.estado) {
            await report.update({ status: req.body.estado });
        }
        res.status(200).json({ status: 'success', data: report });
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