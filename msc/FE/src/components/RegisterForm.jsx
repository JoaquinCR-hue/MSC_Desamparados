import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import UserService from '../services/UserService';
import Swal from 'sweetalert2';
import AuthLayout from './shared/AuthLayout';
import AuthHeader from './shared/AuthHeader';
import InputGroup from './shared/InputGroup';
import PasswordInput from './shared/PasswordInput';
import AuthButton from './shared/AuthButton';
import AuthFooter from './shared/AuthFooter';

/**
 * Formulario de registro de nuevos usuarios ciudadanos con hasheo de contraseñas.
 */
const RegisterForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [nationalId, setNationalId] = useState('');
  
  const [isSearching, setIsSearching] = useState(false);
  const [errors, setErrors] = useState({});
  const [officialName, setOfficialName] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const navigate = useNavigate();

  // Valida la cédula consultando la API de Hacienda
  useEffect(() => {
    const validateNationalId = async () => {
      const nationalIdRegex = /^[1-9]\d{8}$/;
      if (nationalIdRegex.test(nationalId)) {
        setIsSearching(true);
        try {
          const response = await fetch(`https://api.hacienda.go.cr/fe/ae?identificacion=${nationalId}`);
          if (response.ok) {
            const data = await response.json();
            if (data.nombre) {
              setFullName(data.nombre);
              setOfficialName(data.nombre);
              Swal.fire({ title: 'Cédula Verificada', text: `Se ha encontrado a: ${data.nombre}`, icon: 'success' });
            }
          }
        } catch (error) {
          console.error('Error al consultar la cédula:', error);
        } finally {
          setIsSearching(false);
        }
      }
    };
    if (nationalId.length === 9) validateNationalId();
  }, [nationalId]);

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{8}$/;
    
    if (!fullName.trim()) newErrors.fullName = 'El nombre completo es obligatorio';
    if (!emailRegex.test(email)) newErrors.email = 'Ingrese un correo electrónico válido';
    if (!phoneRegex.test(phone)) newErrors.phone = 'El teléfono debe tener 8 dígitos';
    if (password.length < 6) newErrors.password = 'Mínimo 6 caracteres';
    if (password !== confirmPassword) newErrors.confirmPassword = 'No coinciden';
    if (!acceptedTerms) newErrors.terms = 'Acepte los términos';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await UserService.register({
        fullName,
        email,
        password,
        phone,
        nationalId,
        roleId: 3 // Ciudadano
      });

      Swal.fire({ title: '¡Éxito!', text: 'Registro exitoso. Ahora puede iniciar sesión.', icon: 'success' });
      navigate('/login');
    } catch (error) {
      Swal.fire({ title: 'Error', text: error.message, icon: 'error' });
    }
  };

  return (
    <AuthLayout>
      <AuthHeader title="Unirse a la Comunidad" subtitle="Crea tu cuenta oficial" />

      <form onSubmit={handleSubmit}>
        <InputGroup label="Cédula" value={nationalId} isSearching={isSearching} maxLength="9" onChange={(e) => setNationalId(e.target.value.replace(/\D/g, ''))} error={errors.nationalId} />
        <InputGroup label="Nombre Completo" value={fullName} onChange={(e) => setFullName(e.target.value)} error={errors.fullName} />
        <InputGroup label="Teléfono" value={phone} onChange={(e) => setPhone(e.target.value)} error={errors.phone} />
        <InputGroup label="Correo Electrónico" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
        <PasswordInput label="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
        <PasswordInput label="Confirmar Contraseña" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} error={errors.confirmPassword} />

        <div className="terminos-checkbox-container mt-3">
          <label className="terminos-label">
            <input 
              type="checkbox" 
              className="terminos-checkbox"
              checked={acceptedTerms} 
              onChange={(e) => setAcceptedTerms(e.target.checked)} 
            />
            <span>
              Acepto <Link to="/terms" className="terminos-link">términos y condiciones</Link>
            </span>
          </label>
        </div>

        <AuthButton text="CREAR CUENTA" />
      </form>

      <AuthFooter text="¿Ya eres miembro?" linkText="Inicia sesión" linkTo="/login" />
    </AuthLayout>
  );
};

export default RegisterForm;
