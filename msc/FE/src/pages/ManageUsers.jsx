import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import UserManager from '../components/UserManager';
import '../styles/UserManager.css';

/**
 * Página de administración de usuarios del sistema.
 * Solo accesible para administradores (controlado por RoleRoute en Routing).
 */
function ManageUsers() {
  return (
    <div className="manage-users-page">
      <Navbar />
      <div className="manage-users-content">
        <UserManager />
      </div>
      <Footer />
    </div>
  );
}

export default ManageUsers;
