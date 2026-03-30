import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Carrucel from '../components/Carrucel';
import CompInicio from '../components/CompInicio';
import '../styles/Inicio.css';

function Inicio() {
    return(
        <div className="inicio-container">
            <Navbar />
            <div className="Carrucel-container">
                <Carrucel />
                <CompInicio />
            </div>
            <Footer />
        </div>
    )
}
export default Inicio;