const { User, Role } = require('../models');

// Helper to map DB user to FE user format
const mapUserToFE = (user) => {
    let roleName = 'ciudadano';
    if (user.roleId === 1) roleName = 'admin';
    else if (user.roleId === 2) roleName = 'funcionario';
    else if (user.roleId === 3) roleName = 'ciudadano';
    else if (user.role) roleName = user.role.name;

    return {
        id: user.id,
        email: user.email,
        pass: user.password,
        nombre: user.fullName,
        telefono: user.phone,
        role: roleName,
        cedula: user.nationalId
    };
};

exports.getAll = async (req, res) => {
    try {
        const users = await User.findAll({ include: [{ model: Role, as: 'role' }] });
        const mappedUsers = users.map(mapUserToFE);
        res.status(200).json({ status: 'success', data: mappedUsers });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { email, pass, nombre, telefono, role, cedula } = req.body;
        
        let finalRoleId = 3; // Default to 3 (ciudadano)
        
        if (role) {
            const roleStr = role.toLowerCase();
            if (roleStr === 'admin' || roleStr === 'administrador') finalRoleId = 1;
            else if (roleStr === 'funcionario') finalRoleId = 2;
        }

        // Ensure role exists
        let roleObj = await Role.findByPk(finalRoleId);
        if (!roleObj) {
            let roleName = finalRoleId === 1 ? 'admin' : (finalRoleId === 2 ? 'funcionario' : 'ciudadano');
            roleObj = await Role.create({ 
                id: finalRoleId, 
                name: roleName, 
                description: `Rol ${roleName} creado aut.` 
            });
        }

        const newUser = await User.create({
            email,
            password: pass,
            fullName: nombre,
            phone: telefono,
            nationalId: cedula,
            roleId: finalRoleId
        });

        res.status(201).json({ status: 'success', data: mapUserToFE(newUser) });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { email, pass, nombre, telefono, role, cedula } = req.body;
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });
        
        let updateData = {};
        if (email !== undefined) updateData.email = email;
        if (pass !== undefined) updateData.password = pass;
        if (nombre !== undefined) updateData.fullName = nombre;
        if (telefono !== undefined) updateData.phone = telefono;
        if (cedula !== undefined) updateData.nationalId = cedula;
        
        if (role) {
            let finalRoleId = 3;
            const roleStr = role.toLowerCase();
            if (roleStr === 'admin' || roleStr === 'administrador') finalRoleId = 1;
            else if (roleStr === 'funcionario') finalRoleId = 2;

            let roleObj = await Role.findByPk(finalRoleId);
            if (!roleObj) {
                let roleName = finalRoleId === 1 ? 'admin' : (finalRoleId === 2 ? 'funcionario' : 'ciudadano');
                roleObj = await Role.create({ 
                    id: finalRoleId, 
                    name: roleName, 
                    description: `Rol ${roleName} creado aut.` 
                });
            }
            updateData.roleId = finalRoleId;
        }

        await user.update(updateData);
        res.status(200).json({ status: 'success', data: mapUserToFE(user) });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });
        await user.destroy();
        res.status(200).json({ status: 'success', message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};