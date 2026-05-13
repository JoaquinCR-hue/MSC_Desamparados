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
 * Formulario de registro de nuevos usuarios ciudadanos.
 * Valida la cédula contra la API de Hacienda y verifica duplicados antes de crear el usuario.
 */
const RegisterForm = () => {
  // Estados del formulario de registro
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role] = useState('ciudadano');
  const [nationalId, setNationalId] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [errors, setErrors] = useState({});
  const [officialName, setOfficialName] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const navigate = useNavigate();

  const togglePassword = () => setShowPassword(!showPassword);

  // Valida la cédula consultando la API de Hacienda de Costa Rica
  useEffect(() => {
    const validateNationalId = async () => {
      const nationalIdRegex = /^[1-9]\d{8}$/;

      if (nationalIdRegex.test(nationalId)) {
        setIsSearching(true);
        try {
          const response = await fetch(`https://api.hacienda.go.cr/fe/ae?identificacion=${nationalId}`);

          if (response.ok) {
            const data = await response.json();
            const foundName = data.nombre;

            if (foundName) {
              setFullName(foundName);
              setOfficialName(foundName);
              setErrors((prev) => ({ ...prev, nationalId: '' }));
              Swal.fire({ title: 'Cédula Verificada', text: `Se ha encontrado a: ${foundName}`, icon: 'success', confirmButtonText: 'Aceptar' });
            } else {
              Swal.fire({ title: 'Seguridad', text: 'Por su seguridad y la de nuestros habitantes no puedes registrarte sin una cédula válida', icon: 'warning' });
            }
          } else {
            Swal.fire({ title: 'Seguridad', text: 'Por su seguridad y la de nuestros habitantes no puedes registrarte sin una cédula válida', icon: 'warning' });
          }
        } catch (error) {
          console.error('Error al consultar la cédula:', error);
          // Modo demo para pruebas locales
          if (nationalId === '123456789') {
            setFullName('Juan Pérez');
            setOfficialName('Juan Pérez');
            setErrors((prev) => ({ ...prev, nationalId: '' }));
            Swal.fire({ title: 'Cédula Verificada (Demo)', text: 'Se ha encontrado a: Juan Pérez', icon: 'success', confirmButtonText: 'Aceptar' });
          } else {
            Swal.fire({ title: 'Seguridad', text: 'Por su seguridad y la de nuestros habitantes no puedes registrarte sin una cédula válida', icon: 'warning' });
          }
        } finally {
          setIsSearching(false);
        }
      } else if (nationalId.length > 0 && !nationalIdRegex.test(nationalId)) {
        setErrors((prev) => ({ ...prev, nationalId: 'La cédula debe tener 9 dígitos numéricos (formato: #########)' }));
      }
    };

    if (nationalId.length === 9) {
      validateNationalId();
    } else {
      // Resetear nombre si la cédula cambia o es inválida
      setFullName('');
      setOfficialName('');
    }
  }, [nationalId]);

  /**
   * Valida todos los campos del formulario antes del envío.
   * @returns {{ isValid: boolean, newErrors: object }}
   */
  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{8}$/;
    const nationalIdRegex = /^[1-9]\d{8}$/;

    // Validaciones de contraseña: mínimo 6 caracteres, una mayúscula, minúscula y número
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!fullName.trim()) {
      newErrors.fullName = 'El nombre completo es obligatorio';
    } else if (officialName && fullName.trim().toLowerCase() !== officialName.trim().toLowerCase()) {
      newErrors.fullName = 'El nombre no coincide con el registro oficial de la cédula';
    }

    if (!nationalIdRegex.test(nationalId)) {
      newErrors.nationalId = 'Debe ingresar una cédula válida de 9 dígitos';
      Swal.fire({ title: 'Seguridad', text: 'Por su seguridad y la de nuestros habitantes no puedes registrarte sin una cédula válida', icon: 'warning' });
    }

    if (!phoneRegex.test(phone)) newErrors.phone = 'El teléfono debe tener 8 dígitos';
    if (!emailRegex.test(email)) newErrors.email = 'Ingrese un correo electrónico válido';

    if (password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    } else if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      newErrors.password = 'La contraseña debe tener al menos una mayúscula, una minúscula y un número';
    }

    if (password !== confirmPassword) newErrors.confirmPassword = 'Las contraseñas no coinciden';
    if (!acceptedTerms) newErrors.terms = 'Debe aceptar los términos y condiciones';

    setErrors(newErrors);
    return { isValid: Object.keys(newErrors).length === 0, newErrors };
  };

  /**
   * Envía el formulario de registro.
   * Verifica si el usuario ya existe y crea el nuevo registro si no hay duplicados.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const { isValid, newErrors } = validateForm();

    if (!isValid) {
      Swal.fire({ title: 'Atención', html: `Revisa los siguientes puntos:<br/><br/>${Object.values(newErrors).map((err) => `• ${err}`).join('<br/>')}`, icon: 'warning' });
      return;
    }

    try {
      // Verificar que no exista ya un usuario con el mismo correo o cédula
      const existingUsers = await UserService.getUsers();
      const alreadyExists = existingUsers.find((u) => u.email === email || u.cedula === nationalId);

      if (alreadyExists) {
        setErrors((prev) => ({ ...prev, email: 'Este usuario ya está registrado' }));
        Swal.fire({ title: 'Error', text: 'Este usuario ya está registrado 💜', icon: 'error', background: 'var(--bg-main)', color: 'var(--text-main)' });
        return;
      }

      // Construir el objeto del nuevo usuario
      const newUser = {
        email,
        pass: password,
        nombre: fullName,
        telefono: phone,
        role,
        cedula: nationalId,
      };

      await UserService.createUser(newUser);

      Swal.fire({ title: '¡Éxito!', text: 'Registro exitoso. ¡Bienvenido!', icon: 'success', background: 'var(--bg-main)', color: 'var(--text-main)' });
      navigate('/login');
    } catch (error) {
      Swal.fire({ title: 'Error', text: 'No se pudo verificar la información o realizar el registro', icon: 'error' });
    }
  };

  return (
    <AuthLayout>
      <AuthHeader title="Unirse a la Comunidad" subtitle="Crea tu cuenta oficial" />

      <form onSubmit={handleSubmit}>
        <InputGroup label="Nombre Completo" value={fullName} onChange={(e) => setFullName(e.target.value)} error={errors.fullName} />
        <InputGroup label="Cédula" value={nationalId} isSearching={isSearching} maxLength="9" placeholder="Ej: 112340567" onChange={(e) => setNationalId(e.target.value.replace(/\D/g, ''))} error={errors.nationalId} />
        <InputGroup label="Teléfono" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} error={errors.phone} />
        <InputGroup label="Correo Electrónico" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
        <PasswordInput label="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} showPassword={showPassword} togglePassword={togglePassword} error={errors.password} />
        <PasswordInput label="Confirmar Contraseña" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} showPassword={showPassword} togglePassword={togglePassword} error={errors.confirmPassword} />

        <div className="terminos-checkbox-container">
          <label className="terminos-label">
            <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="terminos-checkbox" />
            Acepto los términos y condiciones
          </label>
          <Link to="/terms" target="_blank" rel="noopener noreferrer" className="terminos-link">
            Ver términos y condiciones
          </Link>
          {errors.terms && <span className="error-message">{errors.terms}</span>}
        </div>

        <AuthButton text="CREAR CUENTA" className="btn-registro" />
      </form>

      <AuthFooter text="¿Ya eres miembro?" linkText="Inicia sesión" linkTo="/login" />
    </AuthLayout>
  );
};

export default RegisterForm;
