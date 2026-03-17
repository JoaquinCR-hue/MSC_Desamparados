import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Carrucel from '../components/Carrucel';

function Inicio() {
    return(
        <>
        <div className="Navbar-container">
            <Navbar />
      </div>
        <div className="Carrucel-container">
            <Carrucel />
        </div>
         <div className="Footer-container">
            <Footer />
        </div>
        </>
    )
}
export default Inicio;