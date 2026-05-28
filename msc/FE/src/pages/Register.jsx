import React from 'react';
import Navbar from '../components/Navbar';
import RegisterForm from '../components/RegisterForm';

/**
 * Página de registro de nuevos usuarios.
 * Muestra la barra de navegación y el formulario de creación de cuenta.
 */
function Register() {
  return (
    <>
      <Navbar />
      <RegisterForm />
    </>
  );
}

export default Register;
