import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ServiceUsuarios from '../services/ServiceUsuarios'
import Swal from 'sweetalert2';

function FormLogin() {
  const [nameUsuario, setNameUsuario] = useState("")
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

    if (!nameUsuario || !contra) {
      Swal.fire({
        title: 'Error',
        text: 'Todos los campos son obligatorios y no pueden estar vacíos 💜',
        icon: 'warning'
      });
      return;
    }

    const usuarioValido = usuarios.find((u) => u.nombreUsu === nameUsuario && u.pass === contra)

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
          navigate('/VistaJefaPolicia');
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

  return (
    <div className="auth-card">
      <div className="auth-header">
        {/* <h2>Bienvenido de Nuevo</h2> */}
        <p>Inicia sesión con tu cuenta oficial</p>
      </div>

      <form onSubmit={validarInicio}>
        <div className="input-group">
          <label>Nombre de Usuario</label>
          <input
            type='text'
            value={nameUsuario}
            onChange={(evento) => setNameUsuario(evento.target.value)}
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

      <p className="auth-footer">
        ¿No eres miembro? <Link to="/Registrarse">Registrate</Link>
      </p>
    </div>
  )
}

export default FormLogin
