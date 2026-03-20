import React from 'react';
import './AuthHeader.css';

const AuthHeader = ({ title, subtitle }) => {
  return (
    <div className="auth-header">
      {title && <h2>{title}</h2>}
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
};

export default AuthHeader;
