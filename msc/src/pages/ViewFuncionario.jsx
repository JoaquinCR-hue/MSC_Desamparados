import FuncionarioDashboard from '../components/FuncionarioDashboard'
import ServiceUsuarios from '../services/ServiceUsuarios';
import { useEffect, useState } from 'react'; 
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

function ViewFuncionario() {
  return (
    <div>
      <Navbar />
      <FuncionarioDashboard />
      <Footer />
    </div>
  )
}

export default ViewFuncionario
