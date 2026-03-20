import React from 'react';
import './AuthButton.css';

const AuthButton = ({ text, type = "submit", className = "" }) => {
  return (
    <button type={type} className={`btn-auth ${className}`}>
      {text}
    </button>
  );
};

export default AuthButton;
