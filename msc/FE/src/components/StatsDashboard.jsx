import React, { useState, useEffect } from 'react';
import UserService from '../services/UserService';
import ReportService from '../services/ReportService';
import '../styles/StatsDashboard.css';

// Componente para la visualización de estadísticas e indicadores clave (Dashboard)
const StatsDashboard = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalReports: 0,
        reportsByType: {},
        reportsByDistrict: {},
        usersByRole: {},
        recentReports: []
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Obtener datos concurrentemente desde el backend
                const [users, reports] = await Promise.all([
                    UserService.getUsers(),
                    ReportService.getReports()
                ]);

                // Procesamiento de estadísticas: Reportes por Tipo
                const byType = reports.reduce((acc, r) => {
                    acc[r.tipo] = (acc[r.tipo] || 0) + 1;
                    return acc;
                }, {});

                // Procesamiento de estadísticas: Reportes por Distrito
                const byDistrict = reports.reduce((acc, r) => {
                    acc[r.distrito] = (acc[r.distrito] || 0) + 1;
                    return acc;
                }, {});

                // Procesamiento de estadísticas: Usuarios por Rol
                const byRole = users.reduce((acc, u) => {
                    acc[u.role] = (acc[u.role] || 0) + 1;
                    return acc;
                }, {});

                // Ordenar y obtener los 5 reportes más recientes
                const recent = [...reports]
                    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                    .slice(0, 5);

                setStats({
                    totalUsers: users.length,
                    totalReports: reports.length,
                    reportsByType: byType,
                    reportsByDistrict: byDistrict,
                    usersByRole: byRole,
                    recentReports: recent
                });
            } catch (error) {
                console.error("Error loading statistics:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div className="loading-stats">Cargando estadísticas...</div>;

    // Calcular el valor máximo para normalizar las barras del gráfico
    const maxReports = Math.max(...Object.values(stats.reportsByDistrict), 1);

    return (
        <div className="stats-dashboard">
            <header className="stats-header">
                <h1>Estadísticas del Sistema</h1>
                <p>Monitoreo en tiempo real de incidentes y participación ciudadana.</p>
            </header>

            <div className="stats-grid">
                <div className="stat-card glass">
                    <h3>Total Usuarios</h3>
                    <div className="stat-value">{stats.totalUsers}</div>
                    <p>Usuarios registrados</p>
                </div>
                <div className="stat-card glass highlight">
                    <h3>Total Reportes</h3>
                    <div className="stat-value">{stats.totalReports}</div>
                    <p>Incidentes reportados</p>
                </div>
                <div className="stat-card glass">
                    <h3>Funcionarios</h3>
                    <div className="stat-value">{stats.usersByRole.funcionario || 0}</div>
                    <p>Personal activo</p>
                </div>
                <div className="stat-card glass">
                    <h3>Reportes Hoy</h3>
                    <div className="stat-value">
                        {stats.recentReports.filter(r => new Date(r.fecha).toDateString() === new Date().toDateString()).length}
                    </div>
                    <p>Últimas 24 horas</p>
                </div>
            </div>

            <div className="charts-container">
                <div className="chart-wrapper glass">
                    <h3>Distribución de Incidentes por Distrito</h3>
                    <div className="bar-chart">
                        {Object.entries(stats.reportsByDistrict).map(([district, count]) => (
                            <div key={district} className="bar-item">
                                <div className="bar-label">{district}</div>
                                <div className="bar-track">
                                    <div 
                                        className="bar-fill" 
                                        style={{ '--bar-width': `${(count / maxReports) * 100}%` }}
                                    >
                                        <span className="bar-count">{count}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {Object.keys(stats.reportsByDistrict).length === 0 && (
                            <p className="no-data">No hay datos de distritos disponibles.</p>
                        )}
                    </div>
                </div>

                <div className="chart-wrapper glass">
                    <h3>Tipos de Incidentes</h3>
                    <div className="type-list">
                        {Object.entries(stats.reportsByType).map(([type, count]) => (
                            <div key={type} className="type-item">
                                <span className="type-dot"></span>
                                <span className="type-name">{type}</span>
                                <span className="type-count">{count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="recent-alerts-wrapper glass">
                <h3>Alertas Recientes</h3>
                <div className="table-responsive">
                    <table className="stats-table">
                        <thead>
                            <tr>
                                <th>Tipo</th>
                                <th>Ubicación</th>
                                <th>Fecha</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.recentReports.map(report => (
                                <tr key={report.id}>
                                    <td>{report.tipo}</td>
                                    <td>{report.distrito}, {report.barrio}</td>
                                    <td>{new Date(report.fecha).toLocaleString()}</td>
                                </tr>
                            ))}
                            {stats.recentReports.length === 0 && (
                                <tr>
                                    <td colSpan="3" className="no-data">No hay reportes recientes.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default StatsDashboard;
