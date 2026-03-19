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

const ProtectedRoute = ({ children }) => {
  const user = localStorage.getItem('user');
  if (!user) {
    return <Navigate to="/login" replace />;
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
            <Route path="/gestion-usuarios" element={<GestionUsuarios />} />
        </Routes>
    </Router>
    )   
}
export default Routing;