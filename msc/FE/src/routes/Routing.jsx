import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import NavigationSpinner from '../components/NavigationSpinner';

// ── Páginas en inglés ──────────────────────────────────────────────
import Home from '../pages/Home';
import LoginPage from '../pages/LoginPage';
import Register from '../pages/Register';
import CitizenView from '../pages/CitizenView';
import ReportIncident from '../pages/ReportIncident';
import ManageUsers from '../pages/ManageUsers';
import ManageReports from '../pages/ManageReports';
import ManageConsults from '../pages/ManageConsults';
import Statistics from '../pages/Statistics';
import RiskMap from '../pages/RiskMap';
import SafeRoutesPage from '../pages/SafeRoutesPage';
import PatrolMapPage from '../pages/PatrolMapPage';
import TermsConditionsPage from '../pages/TermsConditionsPage';
import EmergenciesPage from '../pages/EmergenciesPage';
import ContactPage from '../pages/ContactPage';
import OfficerDashboardPage from '../pages/OfficerDashboardPage';



/**
 * Componente de guardia de ruta basado en rol.
 * Redirige al login si no hay sesión activa.
 * Redirige al inicio si el rol no tiene permiso.
 * @param {string[]} allowedRoles - Roles permitidos para acceder a la ruta
 */
const RoleRoute = ({ element, allowedRoles }) => {
  const userStr = sessionStorage.getItem('user');

  // Si no hay sesión activa, redirigir al login
  if (!userStr) return <Navigate to="/login" replace />;

  let user;
  try {
    user = JSON.parse(userStr);
  } catch {
    return <Navigate to="/login" replace />;
  }

  // Normalizar rol a minúsculas (ej: 'Funcionario' → 'funcionario')
  const userRole = (user.role || '').toString().toLowerCase();
  // Normalizar roles permitidos
  const normalizedAllowed = allowedRoles.map(r => r.toString().toLowerCase());

  // Mapa de alias para soportar variantes en español/inglés
  const roleAliasMap = {
    funcionario: ['funcionario', 'officer'],
    ciudadano: ['ciudadano', 'citizen'],
    admin: ['admin', 'administrador']
  };

  const isAllowed = normalizedAllowed.some(r => {
    if (r === userRole) return true;
    return Object.values(roleAliasMap).some(arr => arr.includes(userRole) && arr.includes(r));
  });

  if (!isAllowed) return <Navigate to="/" replace />;
  return element;
};

/**
 * Configuración central de rutas de la aplicación.
 * Todas las rutas URL están en inglés y en kebab-case.
 */
const Routing = () => {
  return (
    <BrowserRouter>
      <NavigationSpinner />
      <Routes>
        {/* ── Rutas Públicas ─────────────────────────────── */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/risk-map" element={<RiskMap />} />
        <Route path="/emergencies" element={<EmergenciesPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/terms" element={<TermsConditionsPage />} />

        {/* ── Compatibilidad con rutas antiguas (redirigen a las nuevas) ─── */}
        <Route path="/mapa-riesgo" element={<Navigate to="/risk-map" replace />} />
        <Route path="/registrarse" element={<Navigate to="/register" replace />} />
        <Route path="/VistaCiudadano" element={<Navigate to="/citizen-view" replace />} />
        <Route path="/VistaFuncionario" element={<Navigate to="/officer-view" replace />} />
        <Route path="/emergencias" element={<Navigate to="/emergencies" replace />} />
        <Route path="/contactenos" element={<Navigate to="/contact" replace />} />
        <Route path="/terminos" element={<Navigate to="/terms" replace />} />
        <Route path="/gestion-usuarios" element={<Navigate to="/manage-users" replace />} />
        <Route path="/gestion-reportes" element={<Navigate to="/manage-reports" replace />} />
        <Route path="/gestion-consultas" element={<Navigate to="/manage-consults" replace />} />
        <Route path="/estadisticas" element={<Navigate to="/statistics" replace />} />
        <Route path="/reportar-incidente" element={<Navigate to="/report-incident" replace />} />
        <Route path="/rutas-seguras" element={<Navigate to="/safe-routes" replace />} />

        {/* ── Rutas Ciudadano ────────────────────────────── */}
        <Route path="/citizen-view" element={<RoleRoute element={<CitizenView />} allowedRoles={['ciudadano']} />} />
        <Route path="/report-incident" element={<RoleRoute element={<ReportIncident />} allowedRoles={['ciudadano', 'funcionario', 'admin', 'administrador']} />} />
        <Route path="/safe-routes" element={<RoleRoute element={<SafeRoutesPage />} allowedRoles={['ciudadano', 'funcionario', 'admin', 'administrador']} />} />

        {/* ── Rutas Funcionario ──────────────────────────── */}
        <Route path="/officer-view" element={<RoleRoute element={<OfficerDashboardPage />} allowedRoles={['funcionario', 'admin', 'administrador']} />} />
        <Route path="/manage-reports" element={<RoleRoute element={<ManageReports />} allowedRoles={['funcionario', 'admin', 'administrador']} />} />
        <Route path="/statistics" element={<RoleRoute element={<Statistics />} allowedRoles={['funcionario', 'admin', 'administrador']} />} />
        <Route path="/patrol-map" element={<RoleRoute element={<PatrolMapPage />} allowedRoles={['funcionario', 'admin', 'administrador']} />} />

        {/* ── Rutas Admin ────────────────────────────────── */}
        <Route path="/manage-users" element={<RoleRoute element={<ManageUsers />} allowedRoles={['admin', 'administrador']} />} />
        <Route path="/manage-consults" element={<RoleRoute element={<ManageConsults />} allowedRoles={['admin', 'administrador']} />} />

        {/* ── Ruta no encontrada → redirige al inicio ────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Routing;
