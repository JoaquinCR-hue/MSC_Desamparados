import React, { useState, useEffect } from 'react';
import ServiceUsuarios from '../services/ServiceUsuarios';
import ServiceReportes from '../services/ServiceReportes';
import '../styles/Estadisticas.css';

const VisualizacionEstadisticas = () => {
    const [stats, setStats] = useState({
        totalUsuarios: 0,
        totalReportes: 0,
        reportesPorTipo: {},
        reportesPorDistrito: {},
        usuariosPorRol: {},
        recientes: []
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [usuarios, reportes] = await Promise.all([
                    ServiceUsuarios.getUsuarios(),
                    ServiceReportes.getReportes()
                ]);

                // Procesar Estadísticas
                const porTipo = reportes.reduce((acc, r) => {
                    acc[r.tipo] = (acc[r.tipo] || 0) + 1;
                    return acc;
                }, {});

                const porDistrito = reportes.reduce((acc, r) => {
                    acc[r.distrito] = (acc[r.distrito] || 0) + 1;
                    return acc;
                }, {});

                const porRol = usuarios.reduce((acc, u) => {
                    acc[u.role] = (acc[u.role] || 0) + 1;
                    return acc;
                }, {});

                const recientes = [...reportes]
                    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                    .slice(0, 5);

                setStats({
                    totalUsuarios: usuarios.length,
                    totalReportes: reportes.length,
                    reportesPorTipo: porTipo,
                    reportesPorDistrito: porDistrito,
                    usuariosPorRol: porRol,
                    recientes: recientes
                });
            } catch (error) {
                console.error("Error cargando estadísticas:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div className="loading-stats">Cargando estadísticas...</div>;

    const maxReports = Math.max(...Object.values(stats.reportesPorDistrito), 1);

    return (
        <div className="stats-dashboard">
            <header className="stats-header">
                <h1>Estadísticas del Sistema</h1>
                <p>Monitoreo en tiempo real de incidentes y participación ciudadana.</p>
            </header>

            <div className="stats-grid">
                <div className="stat-card glass">
                    <h3>Total Usuarios</h3>
                    <div className="stat-value">{stats.totalUsuarios}</div>
                    <p>Usuarios registrados</p>
                </div>
                <div className="stat-card glass highlight">
                    <h3>Total Reportes</h3>
                    <div className="stat-value">{stats.totalReportes}</div>
                    <p>Incidentes reportados</p>
                </div>
                <div className="stat-card glass">
                    <h3>Funcionarios</h3>
                    <div className="stat-value">{stats.usuariosPorRol.funcionario || 0}</div>
                    <p>Personal activo</p>
                </div>
                <div className="stat-card glass">
                    <h3>Reportes Hoy</h3>
                    <div className="stat-value">
                        {stats.recientes.filter(r => new Date(r.fecha).toDateString() === new Date().toDateString()).length}
                    </div>
                    <p>Últimas 24 horas</p>
                </div>
            </div>

            <div className="charts-container">
                <div className="chart-wrapper glass">
                    <h3>Distribución de Incidentes por Distrito</h3>
                    <div className="bar-chart">
                        {Object.entries(stats.reportesPorDistrito).map(([distrito, count]) => (
                            <div key={distrito} className="bar-item">
                                <div className="bar-label">{distrito}</div>
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
                        {Object.keys(stats.reportesPorDistrito).length === 0 && (
                            <p className="no-data">No hay datos de distritos disponibles.</p>
                        )}
                    </div>
                </div>

                <div className="chart-wrapper glass">
                    <h3>Tipos de Incidentes</h3>
                    <div className="type-list">
                        {Object.entries(stats.reportesPorTipo).map(([tipo, count]) => (
                            <div key={tipo} className="type-item">
                                <span className="type-dot"></span>
                                <span className="type-name">{tipo}</span>
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
                            {stats.recientes.map(reporte => (
                                <tr key={reporte.id}>
                                    <td>{reporte.tipo}</td>
                                    <td>{reporte.distrito}, {reporte.barrio}</td>
                                    <td>{new Date(reporte.fecha).toLocaleString()}</td>
                                    
                                </tr>
                            ))}
                            {stats.recientes.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="no-data">No hay reportes recientes.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default VisualizacionEstadisticas;
