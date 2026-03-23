import React from 'react';
import '../../styles/AuthLayout.css';

const AuthLayout = ({ children }) => {
  return (
    <div className="auth-page-container">
      <div className="auth-card">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
