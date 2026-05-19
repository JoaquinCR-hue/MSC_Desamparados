const { Patrol } = require('../models');

exports.getAll = async (req, res) => {
    try {
        const patrols = await Patrol.findAll();
        // Mapeo FE: { id, nombre_oficiales, unidad, estado, zona, tipo_unidad, horario, lat, lng }
        const mapped = patrols.map(p => ({
            id: p.id,
            nombre_oficiales: p.officerNames,
            unidad: p.unit,
            estado: p.status,
            zona: p.zone,
            tipo_unidad: p.unitType,
            horario: p.schedule,
            lat: p.lat,
            lng: p.lng
        }));
        res.status(200).json({ status: 'success', data: mapped });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { nombre_oficiales, unidad, estado, zona, tipo_unidad, horario, lat, lng } = req.body;
        const patrol = await Patrol.create({
            officerNames: nombre_oficiales,
            unit: unidad,
            status: estado,
            zone: zona,
            unitType: tipo_unidad,
            schedule: horario,
            lat,
            lng
        });
        res.status(201).json({ status: 'success', data: patrol });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { nombre_oficiales, unidad, estado, zona, tipo_unidad, horario, lat, lng } = req.body;
        const patrol = await Patrol.findByPk(req.params.id);
        if (!patrol) return res.status(404).json({ status: 'error', message: 'Not found' });
        await patrol.update({
            officerNames: nombre_oficiales,
            unit: unidad,
            status: estado,
            zone: zona,
            unitType: tipo_unidad,
            schedule: horario,
            lat,
            lng
        });
        res.status(200).json({ status: 'success', data: patrol });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const patrol = await Patrol.findByPk(req.params.id);
        if (!patrol) return res.status(404).json({ status: 'error', message: 'Not found' });
        await patrol.destroy();
        res.status(200).json({ status: 'success', message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};