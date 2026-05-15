import { useState } from 'react';
import UserService from '../services/UserService';
import Swal from 'sweetalert2';
import AuthLayout from './shared/AuthLayout';
import AuthHeader from './shared/AuthHeader';
import InputGroup from './shared/InputGroup';
import PasswordInput from './shared/PasswordInput';
import AuthButton from './shared/AuthButton';
import AuthFooter from './shared/AuthFooter';
import { useNavigate } from 'react-router-dom';

/**
 * Formulario de inicio de sesión.
 * Utiliza autenticación JWT y hasheo de contraseñas mediante el backend.
 */
function LoginForm() {
  const [password, setPassword] = useState('');
  const [nationalId, setNationalId] = useState('');
  const navigate = useNavigate();

  /**
   * Gestiona el inicio de sesión contra el servidor.
   */
  const handleLogin = async (e) => {
    e.preventDefault();

    const nationalIdRegex = /^[1-9]\d{8}$/;

    if (!nationalId || !password) {
      Swal.fire({ title: 'Error', text: 'Todos los campos son obligatorios 💜', icon: 'warning' });
      return;
    }

    if (!nationalIdRegex.test(nationalId)) {
      Swal.fire({ title: 'Formato Inválido', text: 'La cédula debe tener exactamente 9 dígitos.', icon: 'warning' });
      return;
    }

    try {
      // Llamada al servicio de autenticación JWT
      const userData = await UserService.login({ nationalId, password });

      // Guardar datos del usuario y token en sessionStorage
      sessionStorage.setItem('user', JSON.stringify(userData));

      let welcomeMessage = '';
      if (userData.role === 'admin') {
        welcomeMessage = `Bienvenido Administrador(a) ${userData.fullName}.`;
      } else if (userData.role === 'funcionario') {
        welcomeMessage = `Bienvenido Oficial ${userData.fullName}.`;
      } else {
        welcomeMessage = `¡Hola ${userData.fullName}! Gracias por participar.`;
      }

      Swal.fire({
        title: '¡Acceso Autorizado!',
        text: welcomeMessage,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      }).then(() => {
        if (userData.role === 'admin') navigate('/manage-users');
        else if (userData.role === 'funcionario') navigate('/officer-view');
        else navigate('/');
      });
    } catch (error) {
      Swal.fire({ title: 'Error de Acceso', text: error.message, icon: 'error' });
    }
  };

  return (
    <AuthLayout>
      <AuthHeader subtitle="Inicia sesión con tu cuenta oficial" />

      <form onSubmit={handleLogin}>
        <InputGroup
          label="Cédula"
          value={nationalId}
          placeholder="Ingrese su cédula"
          onChange={(e) => setNationalId(e.target.value.replace(/\D/g, ''))}
        />

        <PasswordInput
          label="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <AuthButton text="INICIAR SESIÓN" />
      </form>

      <AuthFooter
        text="¿No eres miembro?"
        linkText="Registrate"
        linkTo="/register"
        extraLinkText="¿Olvidaste tu contraseña?"
      />
    </AuthLayout>
  );
}

export default LoginForm;
