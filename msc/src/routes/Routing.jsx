import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import Inicio from '../pages/Inicio';
import Login from '../pages/Login';
import Registrarse from '../pages/Registrarse';
import ViewAdmin from '../pages/ViewAdmin'; 
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

const ProtectedRoute = ({ children }) => {
  const user = localStorage.getItem('user');
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const AdminRoute = ({ children }) => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return <Navigate to="/login" replace />;
  
  const user = JSON.parse(userStr);
  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return children;
};

function Routing() {
    return(
    <Router>
        <Routes>
            <Route path="/" element={<Inicio />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registrarse" element={<Registrarse />} />
            <Route path="/VistaAdmin" element={<ViewAdmin />} />
            <Route path="/VistaCiudadano" element={<ViewCiudadano />} />
            <Route path="/VistaFuncionario" element={<ViewFuncionario />} />
            <Route path="/reportar-incidente" element={<ProtectedRoute><ReportarIncidente /></ProtectedRoute>} />
            <Route path="/emergencias" element={<Emergencias />} />
            <Route path="/gestion-usuarios" element={<AdminRoute><GestionUsuarios /></AdminRoute>} />
            <Route path="/gestion-reportes" element={<ProtectedRoute><GestionReportes /></ProtectedRoute>} />
            <Route path="/estadisticas" element={<AdminRoute><Estadisticas /></AdminRoute>} />
            <Route path="/mapa-riesgo" element={<MapaRiesgo />} />
            <Route path="/rutas-seguras" element={<ProtectedRoute><RutasSeguras /></ProtectedRoute>} />
            <Route path="/contactenos" element={<Contactenos />} />
            <Route path="/gestion-consultas" element={<AdminRoute><GestionConsultas /></AdminRoute>} />
            <Route path="/terminos" element={<TerminosCondiciones />} />
        </Routes>
    </Router>
    )   
}
export default Routing;