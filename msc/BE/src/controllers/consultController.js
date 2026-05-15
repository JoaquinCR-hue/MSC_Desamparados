const { Consult } = require('../models');
const { Op } = require('sequelize');

/**
 * Obtiene todas las consultas, con soporte para filtros, búsqueda por texto y ordenamiento.
 * 
 * Funcionalidades Avanzadas Soportadas:
 * - Filtro por estado: ?status=Pendiente
 * - Filtro por tipo: ?tipo=Denuncia
 * - Búsqueda por texto (nombre, correo, cédula o descripción): ?search=juan
 * - Ordenamiento dinámico: ?sortBy=date&order=DESC
 * 
 * @param {Object} req - Petición HTTP Express
 * @param {Object} res - Respuesta HTTP Express
 */
exports.getAll = async (req, res) => {
    try {
        const { status, tipo, search, sortBy, order } = req.query;

        // Construir condiciones de búsqueda y filtros
        const consultWhere = {};

        if (status) {
            consultWhere.status = status;
        }

        if (tipo) {
            consultWhere.consultType = tipo;
        }

        if (search) {
            consultWhere[Op.or] = [
                { fullName: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
                { nationalId: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } }
            ];
        }

        // Construir configuración de ordenamiento dinámico
        let orderArray = [['date', 'DESC']]; // Orden por defecto: más recientes primero
        if (sortBy) {
            const validSortFields = ['date', 'status', 'fullName', 'email', 'createdAt'];
            if (validSortFields.includes(sortBy)) {
                const sortOrder = (order && order.toUpperCase() === 'ASC') ? 'ASC' : 'DESC';
                orderArray = [[sortBy, sortOrder]];
            }
        }

        // Ejecutar la consulta con Sequelize
        const consults = await Consult.findAll({
            where: consultWhere,
            order: orderArray
        });

        res.status(200).json(consults);
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { cedula, nombreCompleto, correo, telefono, tipoConsulta, descripcion, fecha, estado } = req.body;
        const consult = await Consult.create({
            nationalId: cedula,
            fullName: nombreCompleto,
            email: correo,
            phone: telefono,
            consultType: tipoConsulta,
            description: descripcion,
            date: fecha || new Date(),
            status: estado || 'Pendiente'
        });
        res.status(201).json(consult);
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { estado, respuesta, fechaRespuesta } = req.body;
        const consult = await Consult.findByPk(req.params.id);
        if (!consult) return res.status(404).json({ status: 'error', message: 'Not found' });
        await consult.update({ status: estado, response: respuesta, responseDate: fechaRespuesta });
        res.status(200).json(consult);
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};