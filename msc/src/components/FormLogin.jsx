import { useEffect, useState } from 'react'
import ServiceUsuarios from '../services/ServiceUsuarios'
import emailjs from '@emailjs/browser'
import Swal from 'sweetalert2';
import AuthLayout from './shared/AuthLayout';
import AuthHeader from './shared/AuthHeader';
import InputGroup from './shared/InputGroup';
import PasswordInput from './shared/PasswordInput';
import AuthButton from './shared/AuthButton';
import AuthFooter from './shared/AuthFooter';
import { useNavigate } from 'react-router-dom';

function FormLogin() {
  const [contra, setContra] = useState("")
  const [cedula, setCedula] = useState("")
  const [usuarios, setUsuarios] = useState([])
  const navigate = useNavigate();

  useEffect(() => {
    async function traerUsuarios() {
      try {
        const peticion = await ServiceUsuarios.getUsuarios()
        setUsuarios(peticion || [])
      } catch (error) {
        console.error("Error al cargar usuarios", error);
      }
    }
    traerUsuarios()
  }, [])

  const validarInicio = (e) => {
    e.preventDefault();

    const cedulaRegex = /^[1-9]\d{8}$/;

    if (!cedula || !contra) {
      Swal.fire({
        title: 'Error',
        text: 'Todos los campos son obligatorios y no pueden estar vacíos 💜',
        icon: 'warning'
      });
      return;
    }

    const usuarioValido = usuarios.find((u) => u.email === correoUsuario && u.pass === contra)

    if (usuarioValido) {
      localStorage.setItem('user', JSON.stringify(usuarioValido));

    // Verificar formato de cédula
    if (!cedulaRegex.test(cedula)) {
      Swal.fire({
        title: 'Seguridad',
        text: 'por su seguridad y la de nustros habitantes no puedes iniciar secion sin una cedula valida',
        icon: 'warning'
      });
      return;
    }
    
    const usuarioExistente = usuarios.find((u) => u.cedula === cedula);

    if (!usuarioExistente) {
      Swal.fire({
        title: 'Seguridad',
        text: 'por su seguridad y la de nustros habitantes no puedes iniciar secion sin una cedula valida',
        icon: 'warning'
      });
      return;
    }

    if (usuarioExistente.pass !== contra) {
      Swal.fire({
        title: 'Error',
        text: 'Credenciales incorrectas. Por favor, intente de nuevo.',
        icon: 'error'
      });
      return;
    }

    // Si todo es correcto
    localStorage.setItem('user', JSON.stringify(usuarioExistente));

    Swal.fire({
      title: '¡Éxito!',
      text: 'Inicio de sesión Exitoso',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    }).then(() => {
      if (usuarioExistente.role === 'admin') {
        navigate('/gestion-usuarios');
      } else if (usuarioExistente.role === 'ciudadano') {
        navigate('/VistaCiudadano');
      } else {
        navigate('/VistaFuncionario');
      }
    });
  }

  const recuperarContrasena = async () => {
    const { value: emailIngresado } = await Swal.fire({
      title: 'Recuperar Contraseña',
      input: 'email',
      inputLabel: 'Ingresa el correo asociado a tu cuenta',
      showCancelButton: true,
      confirmButtonText: 'Enviar nueva clave',
      cancelButtonText: 'Cancelar'
    })

    if (emailIngresado) {
      const usuarioEncontrado = usuarios.find(u => u.email === emailIngresado);

      if (usuarioEncontrado) {
        const nuevaClave = Math.random().toString(36).slice(-6);

        try {
          await ServiceUsuarios.recuperarContra(usuarioEncontrado.id, { pass: nuevaClave });

          const templateParams = {
            nombre: usuarioEncontrado.nombreUsu,
            password: nuevaClave,
            email_to: emailIngresado,
          };

          await emailjs.send(
            'service_p81mum2',
            'template_h4avnom',
            templateParams,
            'gYn0FdHihGBZzj5vp'
          );

          Swal.fire('¡Éxito!', 'Revisa tu correo con tu nueva contraseña temporal.', 'success')
        } catch {
          Swal.fire('Error', 'No se pudo procesar la solicitud', 'error')
        }
      } else {
        Swal.fire('Error', 'Ese correo no está registrado', 'error')
      }
    }
  }
  return (
    <AuthLayout>
      <AuthHeader subtitle="Inicia sesión con tu cuenta oficial" />

      <form onSubmit={validarInicio}>
        <InputGroup 
          label="Cédula"
          value={cedula}
          placeholder="Ingrese su cédula"
          onChange={(evento) => setCedula(evento.target.value)}
        />

        <PasswordInput 
          label="Contraseña"
          value={contra}
          onChange={(evento) => setContra(evento.target.value)}
        />

        <AuthButton text="INICIAR SESIÓN" />
      </form>

      <AuthFooter 
        text="¿No eres miembro?" 
        linkText="Registrate" 
        linkTo="/registrarse" 
        onClickExtra={recuperarContrasena}
        extraLinkText="¿Olvidaste tu contraseña?"
      />
    </AuthLayout>
  )
}
}
export default FormLogin
