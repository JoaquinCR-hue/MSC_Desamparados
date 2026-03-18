import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ServiceUsuarios from '../services/ServiceUsuarios'
import emailjs from '@emailjs/browser'
import Swal from 'sweetalert2';

function FormLogin() {
  const [correoUsuario, setCorreoUsuario] = useState("")
  const [contra, setContra] = useState("")
  const [usuarios, setUsuarios] = useState([])
  const [verPass, setVerPass] = useState(false);

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

  const togglePassword = () => {
    setVerPass(!verPass);
  }

  const validarInicio = (e) => {
    e.preventDefault();

    if (!correoUsuario || !contra) {
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

      Swal.fire({
        title: '¡Éxito!',
        text: 'Inicio de sesión Exitoso',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      }).then(() => { // validar el rol del usuario para redirigir a la vista correspondiente
        if (usuarioValido.role === 'admin') {
          navigate('/VistaAdmin');
        } else if (usuarioValido.role === 'ciudadano') {
          navigate('/VistaCiudadano');
        } else {
          navigate('/VistaFuncionario');
        }
      });
    } else {
      Swal.fire({
        title: 'Error',
        text: 'Credenciales incorrectas. Por favor, intente de nuevo.',
        icon: 'error'
      })
    }
  }
//Función para recuperar contraseña
 const recuperarContrasena = async () => {
  const { value: emailIngresado } = await Swal.fire({
    title: 'Recuperar Contraseña',
    input: 'email',
    inputLabel: 'Ingresa el correo asociado a tu cuenta',
    showCancelButton: true,
    confirmButtonText: 'Enviar nueva clave',
    cancelButtonText: 'Cancelar'
  })

  if (emailIngresado) {// 1. Buscar si el usuario existe en db.json (usando el estado 'usuarios')
    const usuarioEncontrado = usuarios.find(u => u.email === emailIngresado);

    if (usuarioEncontrado) {// 2. Generar una clave temporal (ej: 6 letras/números)
      const nuevaClave = Math.random().toString(36).slice(-6);

      try {
        // --- LLAMADA AL SERVICIO --- 3. Actualizar la clave en el db.json (JSON-SERVER)
        await ServiceUsuarios.recuperarContra(usuarioEncontrado.id, { pass: nuevaClave });

        // Enviar el correo con EmailJS
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
      } catch (error) {
        Swal.fire('Error', 'No se pudo procesar la solicitud', 'error')
      }
    } else {
      Swal.fire('Error', 'Ese correo no está registrado', 'error')
    }
  }
}
  return (
    <div className="auth-card">
      <div className="auth-header">
        {/* <h2>Bienvenido de Nuevo</h2> */}
        <p>Inicia sesión con tu cuenta oficial</p>
      </div>

      <form onSubmit={validarInicio}>
        <div className="input-group">
          <label>Correo Electronico</label>
          <input
            type='text'
            value={correoUsuario}
            onChange={(evento) => setCorreoUsuario(evento.target.value)}
          />
        </div>

        <div className="input-group password-wrapper">
          <label>Contraseña</label>
          <div className="input-with-icon">
            <input
              type={verPass ? "text" : "password"}
              value={contra}
              onChange={(evento) => setContra(evento.target.value)}
            />
            <button
              type="button"
              className="btn-eye"
              onClick={togglePassword}
              tabIndex="-1"
            >
              {verPass ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        <button type="submit" className="btn-auth">INICIAR SESIÓN</button>
      </form>
      <p className="forgot-password">
        <span onClick={recuperarContrasena} className="forgot-password-link">
          ¿Olvidaste tu contraseña?
        </span>
      </p>  

      <p className="auth-footer">
        ¿No eres miembro? <Link to="/Registrarse">Registrate</Link>
      </p>
    </div>
  )
}

export default FormLogin
