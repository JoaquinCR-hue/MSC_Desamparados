import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import Inicio from '../pages/Inicio';
import Login from '../pages/Login';
import Registrarse from '../pages/Registrarse';
import ViewCiudadano from '../pages/ViewCiudadano';
import ViewFuncionario from '../pages/ViewFuncionario';
import ReportarIncidente from '../pages/ReportarIncidente';
import Emergencias from '../pages/Emergencias';
import GestionUsuarios from '../pages/GestionUsuarios';
import GestionReportes from '../pages/GestionReportes';
import Estadisticas from '../pages/Estadisticas';
import MapaRiesgo from '../pages/MapaRiesgo';
import RutasSeguras from '../pages/RutasSeguras';
import Contactenos from '../pages/Contactenos'; 
import GestionConsultas from '../pages/GestionConsultas';
import TerminosCondiciones from '../pages/TerminosCondiciones';
import PatrolMapPage from '../pages/PatrolMapPage';
import A11yToolbar from '../components/A11yToolbar';

const RoleRoute = ({ children, allowedRoles }) => {
  const userStr = sessionStorage.getItem('user');
  if (!userStr) return <Navigate to="/login" replace />;
  
  const user = JSON.parse(userStr);
  if (user.role === 'admin') {
    return children;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function Routing() {
    return(
    <Router>
        <A11yToolbar />
        <Routes>
            <Route path="/" element={<Inicio />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registrarse" element={<Registrarse />} />
            
            {/* Views para cada rol principal */}
            <Route path="/VistaCiudadano" element={<RoleRoute allowedRoles={['ciudadano']}><ViewCiudadano /></RoleRoute>} />
            <Route path="/VistaFuncionario" element={<RoleRoute allowedRoles={['funcionario']}><ViewFuncionario /></RoleRoute>} />
            
            {/* Rutas con acceso restringido por roles */}
            <Route path="/reportar-incidente" element={<RoleRoute allowedRoles={['ciudadano', 'funcionario']}><ReportarIncidente /></RoleRoute>} />
            <Route path="/emergencias" element={<Emergencias />} />
            <Route path="/terminos" element={<TerminosCondiciones />} />
            <Route path="/contactenos" element={<Contactenos />} />
            
            <Route path="/gestion-usuarios" element={<RoleRoute allowedRoles={[]}><GestionUsuarios /></RoleRoute>} />
            <Route path="/gestion-reportes" element={<RoleRoute allowedRoles={['funcionario']}><GestionReportes /></RoleRoute>} />
            <Route path="/gestion-consultas" element={<RoleRoute allowedRoles={[]}><GestionConsultas /></RoleRoute>} />
            <Route path="/estadisticas" element={<RoleRoute allowedRoles={['funcionario']}><Estadisticas /></RoleRoute>} />
            <Route path="/mapa-riesgo" element={<MapaRiesgo />} />
            <Route path="/rutas-seguras" element={<RoleRoute allowedRoles={['ciudadano', 'funcionario']}><RutasSeguras /></RoleRoute>} />
            <Route path="/patrol-map" element={<RoleRoute allowedRoles={['funcionario']}><PatrolMapPage /></RoleRoute>} />
        </Routes>
    </Router>
    )   
}
export default Routing;