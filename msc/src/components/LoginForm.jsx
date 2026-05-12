import { useEffect, useState } from 'react';
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
 * Valida las credenciales del usuario contra el backend y redirige según el rol asignado.
 */
function LoginForm() {
  // Estados del formulario de autenticación
  const [password, setPassword] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  // Carga la lista de usuarios al montar el componente para validación local
  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await UserService.getUsers();
        setUsers(response || []);
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
      }
    }
    fetchUsers();
  }, []);

  /**
   * Valida las credenciales ingresadas y gestiona el inicio de sesión.
   * Redirige al usuario a la vista correspondiente según su rol.
   */
  const handleLogin = (e) => {
    e.preventDefault();

    const nationalIdRegex = /^[1-9]\d{8}$/;

    if (!nationalId || !password) {
      Swal.fire({ title: 'Error', text: 'Todos los campos son obligatorios y no pueden estar vacíos 💜', icon: 'warning' });
      return;
    }

    // Verificar el formato de la cédula (9 dígitos)
    if (!nationalIdRegex.test(nationalId)) {
      Swal.fire({ title: 'Seguridad', text: 'Por su seguridad y la de nuestros habitantes, el formato de la cédula no es válido (deben ser 9 dígitos).', icon: 'warning' });
      return;
    }

    // Asegurarse de que la lista de usuarios sea un arreglo válido
    const userList = Array.isArray(users) ? users : users.usuarios || [];

    if (userList.length === 0) {
      Swal.fire({ title: 'Error de Servidor', text: 'La base de datos de usuarios está vacía o no se pudo cargar correctamente.', icon: 'error' });
      return;
    }

    // Buscar el usuario por cédula
    const existingUser = userList.find((u) => String(u.cedula || '').trim() === String(nationalId).trim());

    if (!existingUser) {
      Swal.fire({ title: 'Error de Acceso', text: `La cédula ${nationalId} no se encuentra registrada en el sistema (Total usuarios: ${userList.length}).`, icon: 'error' });
      return;
    }

    if (existingUser.pass !== password) {
      Swal.fire({ title: 'Error', text: 'Credenciales incorrectas. Por favor, intente de nuevo.', icon: 'error' });
      return;
    }

    // Guardar sesión en sessionStorage y redirigir según el rol
    sessionStorage.setItem('user', JSON.stringify(existingUser));

    let welcomeMessage = '';
    if (existingUser.role === 'admin') {
      welcomeMessage = `Bienvenido Administrador(a) ${existingUser.nombre || ''} al sistema MSC.`;
    } else if (existingUser.role === 'funcionario') {
      welcomeMessage = `Bienvenido Oficial ${existingUser.nombre || ''}, listo para patrullar.`;
    } else {
      welcomeMessage = `¡Hola ${existingUser.nombre || 'Ciudadano'}! Gracias por ayudar a la comunidad.`;
    }

    Swal.fire({
      title: '¡Acceso Autorizado!',
      text: welcomeMessage,
      icon: 'success',
      timer: 2000,
      showConfirmButton: false,
      background: 'var(--bg-main)',
      color: 'var(--text-main)',
    }).then(() => {
      // Redirigir a la vista correspondiente según el rol del usuario
      if (existingUser.role === 'admin') {
        navigate('/manage-users');
      } else if (existingUser.role === 'ciudadano') {
        navigate('/citizen-view');
      } else {
        navigate('/officer-view');
      }
    });
  };

  /**
   * Flujo de recuperación de contraseña:
   * Genera una nueva clave aleatoria, la actualiza en el backend y la envía por correo usando EmailJS.
   */
  const handleRecoverPassword = async () => {
    const { value: enteredEmail } = await Swal.fire({
      title: 'Recuperar Contraseña',
      input: 'email',
      inputLabel: 'Ingresa el correo asociado a tu cuenta',
      showCancelButton: true,
      confirmButtonText: 'Enviar nueva clave',
      cancelButtonText: 'Cancelar',
    });

    if (enteredEmail) {
      const foundUser = users.find((u) => u.email === enteredEmail);

      if (foundUser) {
        // Generar una nueva contraseña temporal de 8 caracteres
        const newPassword = Math.random().toString(36).slice(-8);

        try {
          // Actualizar contraseña en el backend
          await UserService.recoverPassword(foundUser.id, { pass: newPassword });

          // Parámetros para el template de EmailJS
          const templateParams = { email: enteredEmail, password: newPassword };

          // Enviar correo con la nueva contraseña temporal
          await emailjs.send('service_rn1linm', 'template_hn9zqj4', templateParams, 'gYn0FdHihGBZzj5vp');

          Swal.fire('¡Éxito!', 'Revisa tu correo con tu nueva contraseña temporal.', 'success');
        } catch (error) {
          console.error(error);
          Swal.fire('Error', 'No se pudo procesar la solicitud', 'error');
        }
      } else {
        Swal.fire('Error', 'Ese correo no está registrado', 'error');
      }
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
        onClickExtra={handleRecoverPassword}
        extraLinkText="¿Olvidaste tu contraseña?"
      />
    </AuthLayout>
  );
}

export default LoginForm;
