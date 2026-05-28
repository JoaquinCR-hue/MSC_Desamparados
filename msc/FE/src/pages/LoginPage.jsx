import React from 'react';
import Navbar from '../components/Navbar';
import LoginForm from '../components/LoginForm';

/**
 * Página de inicio de sesión.
 * Muestra la barra de navegación y el formulario de autenticación.
 */
function LoginPage() {
  return (
    <>
      <Navbar />
      <LoginForm />
    </>
  );
}

export default LoginPage;
