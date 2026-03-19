import React, { useState, useEffect } from 'react';
import ServiceUsuarios from '../services/ServiceUsuarios';
import MostrarFuncionario from './MostrarFuncionario';
import MostrasUsuarios from './MostrasUsuarios';

const ControlUsuarios = () => {
    const [activeTab, setActiveTab] = useState('funcionarios'); // 'funcionarios' or 'usuarios'
    const [stats, setStats] = useState({ total: 0, funcionarios: 0, ciudadanos: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await ServiceUsuarios.getUsuarios();
                if (data) {
                    setStats({
                        total: data.length,
                        funcionarios: data.filter(u => u.role !== 'ciudadano').length,
                        ciudadanos: data.filter(u => u.role === 'ciudadano').length
                    });
                }
            } catch (error) {
                console.error("Error cargando estadísticas", error);
            }
        };
        fetchStats();
    }, [activeTab]); // recargar estadísticas si cambia de pestaña por si hubo eliminaciones

    return (
        <div className="gestion-container">
            <div className="container">
                {/* Header */}
                <div className="gestion-header">
                    <div className="gestion-title-wrapper">
                        <span className="gestion-subtitle">Control de Acceso</span>
                        <h1 className="gestion-title">Gestión de Usuarios</h1>
                        <span className="gestion-subtext">Base de Datos Centralizada • Nodo Desamparados-01</span>
                    </div>
                </div>

                {/* Stats Cards */}
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
                            <span className="stat-value">{stats.funcionarios}</span>
                        </div>
                        <i className="fa-solid fa-shield-halved stat-icon"></i>
                    </div>

                    <div className="stat-card pending">
                        <h3 className="stat-title">Civiles Registrados</h3>
                        <div className="stat-value-wrapper">
                            <span className="stat-value">{stats.ciudadanos}</span>
                        </div>
                        <i className="fa-solid fa-address-card stat-icon"></i>
                    </div>
                </div>

                {/* Tabs */}
                <div className="view-tabs">
                    <button
                        className={`view-tab ${activeTab === 'funcionarios' ? 'active' : ''}`}
                        onClick={() => setActiveTab('funcionarios')}
                    >
                        Funcionarios
                    </button>
                    <button
                        className={`view-tab ${activeTab === 'usuarios' ? 'active' : ''}`}
                        onClick={() => setActiveTab('usuarios')}
                    >
                        Usuarios Civiles
                    </button>
                </div>

                {/* Render Active Component */}
                {activeTab === 'funcionarios' ? <MostrarFuncionario /> : <MostrasUsuarios />}

            </div>
        </div>
    );
};

export default ControlUsuarios;
