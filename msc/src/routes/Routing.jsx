import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import Inicio from '../pages/Inicio';


function Routing() {
    return(
    <Router>
        <Routes>
            <Route path="/inicio" element={<Inicio />} />
        </Routes>
    </Router>
    )   
}
export default Routing;