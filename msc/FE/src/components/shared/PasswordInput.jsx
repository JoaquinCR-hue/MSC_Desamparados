import React, { useState } from 'react';
import '../../styles/PasswordInput.css';

const PasswordInput = ({ label, value, onChange, placeholder, showPassword, togglePassword, error }) => {
  const [internalVerPass, setInternalVerPass] = useState(false);

  const isVisible = showPassword !== undefined ? showPassword : internalVerPass;
  const onToggle = togglePassword || (() => setInternalVerPass(!internalVerPass));

  return (
    <div className="input-group password-wrapper">
      <label>{label}</label>
      <div className="input-with-icon">
        <input
          type={isVisible ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={error ? "input-error" : ""}
        />
        <button
          type="button"
          className="btn-eye"
          onClick={onToggle}
          tabIndex="-1"
          aria-label={isVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          {isVisible ? <i className="fa-solid fa-eye"></i> : <i className="fa-solid fa-eye-slash"></i>}
        </button>
      </div>
      {error && <span className="error-message">{error}</span>}
    </div>
  );
};

export default PasswordInput;
