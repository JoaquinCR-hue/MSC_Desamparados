const { Consult } = require('../models');

exports.getAll = async (req, res) => {
    try {
        const consults = await Consult.findAll();
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