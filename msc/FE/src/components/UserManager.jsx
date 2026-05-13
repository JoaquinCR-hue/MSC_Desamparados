import React, { useState, useEffect } from 'react';
import UserService from '../services/UserService';
import OfficerList from './OfficerList';
import UserList from './UserList';
import '../styles/UserManager.css';

// Componente para la gestión centralizada de usuarios (Funcionarios y Ciudadanos)
const UserManager = () => {
    const [activeTab, setActiveTab] = useState('officers'); // 'officers' or 'users'
    const [stats, setStats] = useState({ total: 0, officers: 0, citizens: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Obtener todos los usuarios del servicio
                const data = await UserService.getUsers();
                if (data) {
                    setStats({
                        total: data.length,
                        officers: data.filter(u => u.role !== 'ciudadano').length,
                        citizens: data.filter(u => u.role === 'ciudadano').length
                    });
                }
            } catch (error) {
                console.error("Error loading statistics", error);
            }
        };
        fetchStats();
    }, [activeTab]); // Recargar estadísticas si cambia la pestaña

    return (
        <div className="management-container">
            <div className="container">
                {/* Encabezado */}
                <div className="management-header">
                    <div className="management-title-wrapper">
                        <span className="management-subtitle">Control de Acceso</span>
                        <h1 className="management-title">Gestión de Usuarios</h1>
                        <span className="management-subtext">Base de Datos Centralizada • Nodo Desamparados-01</span>
                    </div>
                </div>

                {/* Tarjetas de Estadísticas */}
                <div className="stats-grid">
                    <div className="stat-card total">
                        <h3 className="stat-title">Total Usuarios</h3>
                        <div className="stat-value-wrapper">
                            <span className="stat-value">{stats.total}</span>
                        </div>
                        <i className="fa-solid fa-users stat-icon"></i>
                    </div>

                    <div className="stat-card active">
                        <h3 className="stat-title">Funcionarios</h3>
                        <div className="stat-value-wrapper">
                            <span className="stat-value">{stats.officers}</span>
                        </div>
                        <i className="fa-solid fa-user-tie stat-icon"></i>
                    </div>

                    <div className="stat-card pending">
                        <h3 className="stat-title">Civiles Registrados</h3>
                        <div className="stat-value-wrapper">
                            <span className="stat-value">{stats.citizens}</span>
                        </div>
                        <i className="fa-solid fa-address-card stat-icon"></i>
                    </div>
                </div>

                {/* Pestañas de Navegación */}
                <div className="view-tabs">
                    <button
                        className={`view-tab ${activeTab === 'officers' ? 'active' : ''}`}
                        onClick={() => setActiveTab('officers')}
                    >
                        Funcionarios
                    </button>
                    <button
                        className={`view-tab ${activeTab === 'users' ? 'active' : ''}`}
                        onClick={() => setActiveTab('users')}
                    >
                        Usuarios Civiles
                    </button>
                </div>

                {/* Renderizado del componente activo según la pestaña */}
                {activeTab === 'officers' ? <OfficerList /> : <UserList />}

            </div>
        </div>
    );
};

export default UserManager;
