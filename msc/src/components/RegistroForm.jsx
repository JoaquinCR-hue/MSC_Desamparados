import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ServiceUsuarios from '../services/ServiceUsuarios';
import Swal from 'sweetalert2';
import '../styles/Registro.css';

const RegistroForm = () => {
  const [correoUsuario, setCorreoUsuario] = useState("");
  const [contra, setContra] = useState("");
  const [confirmarContra, setConfirmarContra] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [role, setRole] = useState("ciudadano");

  const [verPass, setVerPass] = useState(false);
  const navigate = useNavigate();

  const togglePassword = () => {
    setVerPass(!verPass);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nombre || !telefono || !correoUsuario || !contra || !confirmarContra || !role) {
      Swal.fire({
        title: 'Error',
        text: 'Todos los campos son obligatorios y no pueden estar vacíos 💜',
        icon: 'warning'
      });
      return;
    }
    //Validacion de longitud de contraseña
    if (contra.length < 6 || confirmarContra.length < 6) {
      Swal.fire({
        title: 'Error',
        text: 'La contraseña debe tener al menos 6 caracteres 💜',
        icon: 'warning'
      });
      return;
    }
    //Validacion de que las contraseñas coincidan
    if (contra !== confirmarContra) {
    Swal.fire({
      title: 'Error',
      text: 'Las contraseñas no coinciden 💜',
      icon: 'warning'
    });
    return;
  }
    try {
    // 2. VALIDACIÓN DE EXISTENCIA: Traer todos los usuarios para comparar
    const usuariosExistentes = await ServiceUsuarios.getUsuarios();
    
    const existe = usuariosExistentes.find(u => u.email === correoUsuario);

    if (existe) {
      Swal.fire({
        title: 'Error',
        text: 'Este correo electrónico ya está registrado 💜',
        icon: 'error'
      });
      return; // Detenemos la ejecución aquí
    }

    // 3. Si no existe, procedemos a crear el objeto y enviarlo
    const nuevoUsuario = {
      email: correoUsuario,
      pass: contra,
      nombre: nombre,
      telefono: telefono,
      role: role // Rol automático
    };

    await ServiceUsuarios.postUsuarios(nuevoUsuario);
    
    Swal.fire({
      title: '¡Éxito!',
      text: 'Registro exitoso. ¡Bienvenido a la familia!',
      icon: 'success'
    });
    navigate('/Login');

  } catch (error) {
    Swal.fire({
      title: 'Error',
      text: 'No se pudo verificar la información o realizar el registro',
      icon: 'error'
    });
  }
};

  return (
    <div className="auth-card">
      <div className="auth-header">
        <h2>Unirse a la Familia</h2>
        <p>Crea tu cuenta oficial</p>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>Nombre Completo</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label>Teléfono</label>
          <input
            type="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label>Correo Electronico</label>
          <input
            type="text"
            value={correoUsuario}
            onChange={(e) => setCorreoUsuario(e.target.value)}
          />
        </div>

        <div className="input-group password-wrapper">
          <label>Contraseña</label>
          <div className="input-with-icon">
            <input
              type={verPass ? "text" : "password"}
              value={contra}
              onChange={(e) => setContra(e.target.value)}
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
        <div className="input-group password-wrapper">
          <label>Confirmar Contraseña</label>
          <div className="input-with-icon">
            <input
              type={verPass ? "text" : "password"}
              value={confirmarContra}
              onChange={(e) => setConfirmarContra(e.target.value)}
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

        <button type="submit" className="btn-auth btn-registro">CREAR CUENTA</button>
      </form>
      <p className="auth-footer">
        ¿Ya eres miembro? <Link to="/Login">Inicia sesión</Link>
      </p>
    </div>
  );
};

export default RegistroForm;
