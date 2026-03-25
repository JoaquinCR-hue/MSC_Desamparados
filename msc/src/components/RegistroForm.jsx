import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ServiceUsuarios from '../services/ServiceUsuarios';
import Swal from 'sweetalert2';
import AuthLayout from './shared/AuthLayout';
import AuthHeader from './shared/AuthHeader';
import InputGroup from './shared/InputGroup';
import PasswordInput from './shared/PasswordInput';
import AuthButton from './shared/AuthButton';
import AuthFooter from './shared/AuthFooter';

const RegistroForm = () => {
  const [correoUsuario, setCorreoUsuario] = useState("");
  const [contra, setContra] = useState("");
  const [confirmarContra, setConfirmarContra] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [role] = useState("ciudadano");
  const [cedula, setCedula] = useState("");

  const [verPass, setVerPass] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [errors, setErrors] = useState({});
  const [nombreOficial, setNombreOficial] = useState("");
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const navigate = useNavigate();

  const togglePassword = () => {
    setVerPass(!verPass);
  }

  // Validación de Cédula y Búsqueda de Nombre
  useEffect(() => {
    const validarCedula = async () => {
      const regexCedula = /^[1-9]\d{8}$/;
      
      if (regexCedula.test(cedula)) {
        setIsSearching(true);
        try {
          const response = await fetch(`https://api.hacienda.go.cr/fe/ae?identificacion=${cedula}`);
          
          if (response.ok) {
            const data = await response.json();
            const nombreEncontrado = data.nombre;

            if (nombreEncontrado) {
              setNombre(nombreEncontrado);
              setNombreOficial(nombreEncontrado);
              setErrors(prev => ({ ...prev, cedula: "" })); // Limpiar error si se encuentra
              Swal.fire({
                title: 'Cédula Verificada',
                text: `Se ha encontrado a: ${nombreEncontrado}`,
                icon: 'success',
                confirmButtonText: 'Aceptar'
              });
            } else {
              Swal.fire({
                title: 'Seguridad',
                text: 'por su seguridad y la de nustros habitantes no puedes registrarte sin una cedula valida',
                icon: 'warning'
              });
            }
          } else {
            Swal.fire({
              title: 'Seguridad',
              text: 'por su seguridad y la de nustros habitantes no puedes registrarte sin una cedula valida',
              icon: 'warning'
            });
          }
        } catch (error) {
          console.error("Error al consultar la cédula:", error);
          if (cedula === "123456789") { // Mock Demo
             setNombre("Juan Pérez");
             setNombreOficial("Juan Pérez");
             setErrors(prev => ({ ...prev, cedula: "" }));
             Swal.fire({
                title: 'Cédula Verificada (Demo)',
                text: `Se ha encontrado a: Juan Pérez`,
                icon: 'success',
                confirmButtonText: 'Aceptar'
              });
          } else {
            Swal.fire({
              title: 'Seguridad',
              text: 'por su seguridad y la de nustros habitantes no puedes registrarte sin una cedula valida',
              icon: 'warning'
            });
          }
        } finally {
          setIsSearching(false);
        }
      } else if (cedula.length > 0 && !regexCedula.test(cedula)) {
        setErrors(prev => ({ ...prev, cedula: "La cédula debe tener 9 dígitos numéricos (formato: #########)" }));
      }
    };

    if (cedula.length === 9) {
      validarCedula();
    } else {
        setNombre(""); // Resetear nombre si la cédula cambia o es inválida
        setNombreOficial("");
    }
  }, [cedula]);

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{8}$/;
    const cedulaRegex = /^[1-9]\d{8}$/;
    
    // Validaciones de Contraseña: 6 caracteres mínimo, una mayúscula, una minúscula, un número
    const passHasUpperCase = /[A-Z]/.test(contra);
    const passHasLowerCase = /[a-z]/.test(contra);
    const passHasNumber = /[0-9]/.test(contra);

    if (!nombre.trim()) {
      newErrors.nombre = "El nombre completo es obligatorio";
    } else if (nombreOficial && nombre.trim().toLowerCase() !== nombreOficial.trim().toLowerCase()) {
      newErrors.nombre = "El nombre no coincide con el registro oficial de la cédula";
    }

    if (!cedulaRegex.test(cedula)) {
      newErrors.cedula = "Debe ingresar una cédula válida de 9 dígitos";
      Swal.fire({
        title: 'Seguridad',
        text: 'por su seguridad y la de nustros habitantes no puedes registrarte sin una cedula valida',
        icon: 'warning'
      });
    }
    if (!phoneRegex.test(telefono)) newErrors.telefono = "El teléfono debe tener 8 dígitos";
    if (!emailRegex.test(correoUsuario)) newErrors.email = "Ingrese un correo electrónico válido";
    
    if (contra.length < 6) {
      newErrors.contra = "La contraseña debe tener al menos 6 caracteres";
    } else if (!passHasUpperCase || !passHasLowerCase || !passHasNumber) {
      newErrors.contra = "La contraseña debe tener al menos una mayúscula, una minúscula y un número";
    }
    
    if (contra !== confirmarContra) newErrors.confirmarContra = "Las contraseñas no coinciden";
    if (!aceptaTerminos) newErrors.terminos = "Debe aceptar los términos y condiciones";

    setErrors(newErrors);
    return { isValid: Object.keys(newErrors).length === 0, newErrors };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { isValid, newErrors } = validateForm();

    if (!isValid) {
      Swal.fire({
        title: 'Atención',
        html: `Revisa los siguientes puntos:<br/><br/>${Object.values(newErrors).map(err => `• ${err}`).join("<br/>")}`,
        icon: 'warning'
      });
      return;
    }

    try {
      const usuariosExistentes = await ServiceUsuarios.getUsuarios();
      const existe = usuariosExistentes.find(u => u.email === correoUsuario);

      if (existe) {
        setErrors(prev => ({ ...prev, email: "Este correo electrónico ya está registrado" }));
        Swal.fire({
          title: 'Error',
          text: 'Este correo electrónico ya está registrado 💜',
          icon: 'error'
        });
        return;
      }

      const nuevoUsuario = {
        email: correoUsuario,
        pass: contra,
        nombre: nombre,
        telefono: telefono,
        role: role,
        cedula: cedula
      };

      await ServiceUsuarios.postUsuarios(nuevoUsuario);
      
      Swal.fire({
        title: '¡Éxito!',
        text: 'Registro exitoso. ¡Bienvenido!',
        icon: 'success'
      });
      navigate('/login');

    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: 'No se pudo verificar la información o realizar el registro',
        icon: 'error'
      });
    }
  };

  return (
    <AuthLayout>
      <AuthHeader title="Unirse a la Comunidad" subtitle="Crea tu cuenta oficial" />
      
      <form onSubmit={handleSubmit}>
        <InputGroup 
          label="Nombre Completo" 
          value={nombre} 
          onChange={(e) => setNombre(e.target.value)} 
          error={errors.nombre}
        />
        
        <InputGroup 
          label="Cédula" 
          value={cedula} 
          isSearching={isSearching}
          maxLength="9"
          placeholder="Ej: 112340567"
          onChange={(e) => setCedula(e.target.value.replace(/\D/g, ''))}
          error={errors.cedula}
        />

        <InputGroup 
          label="Teléfono" 
          type="tel"
          value={telefono} 
          onChange={(e) => setTelefono(e.target.value)} 
          error={errors.telefono}
        />

        <InputGroup 
          label="Correo Electrónico" 
          value={correoUsuario} 
          onChange={(e) => setCorreoUsuario(e.target.value)} 
          error={errors.email}
        />

        <PasswordInput 
          label="Contraseña"
          value={contra}
          onChange={(e) => setContra(e.target.value)}
          showPassword={verPass}
          togglePassword={togglePassword}
          error={errors.contra}
        />

        <PasswordInput 
          label="Confirmar Contraseña"
          value={confirmarContra}
          onChange={(e) => setConfirmarContra(e.target.value)}
          showPassword={verPass}
          togglePassword={togglePassword}
          error={errors.confirmarContra}
        />

        <div style={{ margin: "15px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
          <label style={{ color: "#fff", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem", cursor: "pointer" }}>
            <input 
              type="checkbox" 
              checked={aceptaTerminos}
              onChange={(e) => setAceptaTerminos(e.target.checked)}
              style={{ width: "16px", height: "16px", cursor: "pointer" }}
            />
            Acepto los términos y condiciones
          </label>
          <Link to="/terminos" target="_blank" rel="noopener noreferrer" style={{ color: "#ff8c00", textDecoration: "underline", fontSize: "0.85rem" }}>
            Ver términos y condiciones
          </Link>
          {errors.terminos && <span style={{ color: "#ff4d4d", fontSize: "0.8rem", marginTop: "5px" }}>{errors.terminos}</span>}
        </div>

        <AuthButton text="CREAR CUENTA" className="btn-registro" />
      </form>

      <AuthFooter 
        text="¿Ya eres miembro?" 
        linkText="Inicia sesión" 
        linkTo="/login" 
      />
    </AuthLayout>
  );
};

export default RegistroForm;
