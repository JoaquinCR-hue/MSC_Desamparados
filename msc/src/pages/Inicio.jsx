import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Carrucel from '../components/Carrucel';
import '../styles/Inicio.css';

function Inicio() {
    return(
        <div className="inicio-container">
            <Navbar />
            <div className="Carrucel-container">
                <Carrucel />
            </div>
            <Footer />
        </div>
    )
}
export default Inicio;