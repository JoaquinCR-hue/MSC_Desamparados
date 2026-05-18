const { Report, Location, IncidentType, User, sequelize } = require('../models');

exports.getAll = async (req, res) => {
    try {
        // Limpieza automática: Borrar reportes de más de 3 días (72 horas)
        const tresDiasAtras = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        await Report.destroy({
            where: {
                date: {
                    [require('sequelize').Op.lt]: tresDiasAtras
                }
            }
        });

        const reports = await Report.findAll({
            include: [
                { model: Location, as: 'location' },
                { model: IncidentType, as: 'incidentType' },
                { model: User, as: 'creator' }
            ],
            order: [['date', 'DESC']]
        });

        // Mapeo al formato plano del FE
        const mappedReports = reports.map(r => {
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
                isEmergency: isEmergency
            };
        });

        res.status(200).json({ status: 'success', data: mappedReports });
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