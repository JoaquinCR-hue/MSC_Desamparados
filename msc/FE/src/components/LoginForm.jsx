import { useState } from 'react';
import UserService from '../services/UserService';
import emailjs from '@emailjs/browser';
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
    const cleanedId = nationalId.replace(/\D/g, '');

    if (!nationalId || !password) {
      Swal.fire({ title: 'Error', text: 'Todos los campos son obligatorios 💜', icon: 'warning' });
      return;
    }

    if (!cleanedId || !nationalIdRegex.test(cleanedId)) {
      Swal.fire({ title: 'Formato Inválido', text: 'Debes colocar la cédula correcta.', icon: 'warning' });
      return;
    }

    try {
      // Llamada al servicio de autenticación JWT
      const userData = await UserService.login({ nationalId: cleanedId, password });

      // Normalizar el rol a minúsculas
      userData.role = userData.role ? userData.role.toLowerCase() : 'ciudadano';
      if (userData.role === 'administrador') {
        userData.role = 'admin';
      }
      if (userData.role === 'usuario') {
        userData.role = 'ciudadano';
      }

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
        else if (userData.role === 'ciudadano') navigate('/citizen-view');
        else navigate('/');
      });
    } catch (error) {
      Swal.fire({ title: 'Error de Acceso', text: error.message, icon: 'error' });
    }
  };

  /**
   * Flujo de recuperación de contraseña:
   * Solicita una nueva clave al backend y la envía por correo usando EmailJS.
   */
  const handleRecoverPassword = async () => {
    const { value: enteredEmail } = await Swal.fire({
      title: 'Recuperar Contraseña',
      input: 'email',
      inputLabel: 'Ingresa el correo asociado a tu cuenta',
      showCancelButton: true,
      confirmButtonText: 'Enviar nueva clave',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value) {
          return '¡Necesitas ingresar un correo!';
        }
      }
    });

    if (enteredEmail) {
      try {
        Swal.fire({ title: 'Procesando...', text: 'Por favor espera', allowOutsideClick: false });
        Swal.showLoading();

        // Obtener nueva contraseña del backend
        const newPassword = await UserService.recoverPassword(enteredEmail);

        // Parámetros para el template de EmailJS
        const templateParams = { email: enteredEmail, password: newPassword };

        // Enviar correo con la nueva contraseña temporal
        await emailjs.send('service_rn1linm', 'template_hn9zqj4', templateParams, 'gYn0FdHihGBZzj5vp');

        Swal.fire('¡Éxito!', 'Revisa tu correo con tu nueva contraseña temporal.', 'success');
      } catch (error) {
        console.error(error);
        Swal.fire('Error', error.message || 'No se pudo procesar la solicitud', 'error');
      }
    }
  };

  return (
    <AuthLayout>
      <AuthHeader subtitle="Inicia sesión con tu cuenta oficial" />

      <form onSubmit={handleLogin}>
        <InputGroup
          label="Cédula"
          type="number"
          value={nationalId}
          placeholder="Ingrese su cédula"
          onChange={(e) => setNationalId(e.target.value)}
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
        onClickExtra={handleRecoverPassword}
        extraLinkText="¿Olvidaste tu contraseña?"
      />
    </AuthLayout>
  );
}

export default LoginForm;
