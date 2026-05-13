import React, { useState, useEffect } from 'react';
import UserService from '../services/UserService';
import '../styles/UserList.css';

const UserList = () => {
  const [users, setUsers] = useState([]);
  
  // Estado para la edición
  const [editingId, setEditingId] = useState(null);
  const [editUser, setEditUser] = useState(null);

  const loadData = async () => {
    const data = await UserService.getUsers();
    if (data) {
      // Filtrar para mostrar solo usuarios con rol 'ciudadano'
      setUsers(data.filter(u => u.role === 'ciudadano'));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id) => {
    import('sweetalert2').then(Swal => {
      Swal.default.fire({
        title: '¿Eliminar Usuario Civil?',
        text: "Esta acción borrará permanentemente al usuario.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#334155',
        confirmButtonText: 'Sí, eliminar'
      }).then(async (result) => {
        if (result.isConfirmed) {
          await UserService.deleteUser(id);
          loadData();
          Swal.default.fire('¡Eliminado!', 'El usuario ha sido borrado exitosamente.', 'success');
        }
      });
    });
  };

  const handleEditClick = (user) => {
    setEditingId(user.id);
    setEditUser({ ...user });
  };

  const handleSaveEdit = async (id) => {
    await UserService.updateUser(editUser, id);
    setEditingId(null);
    setEditUser(null);
    loadData();
    import('sweetalert2').then(Swal => {
      Swal.default.fire('¡Actualizado!', 'Los datos del usuario se modificaron.', 'success');
    });
  };

  return (
    <div className="list-container">
      <div className="list-controls">
        <h3 className="section-title">Lista de Usuarios Civiles</h3>
      </div>

      <div className="table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              <th>NOMBRE</th>
              <th>CORREO</th>
              <th>TELÉFONO</th>
              <th>ROL</th>
              <th>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              editingId === user.id ? (
                <tr key={user.id} className="edit-row">
                  <td><input type="text" className="inline-input" value={editUser.nombre} onChange={e => setEditUser({...editUser, nombre: e.target.value})} /></td>
                  <td><input type="email" className="inline-input" value={editUser.email} onChange={e => setEditUser({...editUser, email: e.target.value})} /></td>
                  <td><input type="text" className="inline-input" value={editUser.telefono} onChange={e => setEditUser({...editUser, telefono: e.target.value})} /></td>
                  <td><span className="badge-role">{user.role.toUpperCase()}</span></td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-action btn-save" title="Guardar" onClick={() => handleSaveEdit(user.id)}>
                        <i className="fa-solid fa-check"></i>
                      </button>
                      <button className="btn-action btn-delete" title="Cancelar" onClick={() => setEditingId(null)}>
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={user.id}>
                  <td><strong>{user.nombre}</strong></td>
                  <td>{user.email}</td>
                  <td>{user.telefono}</td>
                  <td><span className="badge-role">{user.role.toUpperCase()}</span></td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-action" title="Editar" onClick={() => handleEditClick(user)}>
                        <i className="fa-solid fa-pen"></i>
                      </button>
                      <button className="btn-action btn-delete" title="Eliminar" onClick={() => handleDelete(user.id)}>
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              )
            ))}
            {users.length === 0 && (
              <tr><td colSpan="5" className="empty-row-text">No hay usuarios registrados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserList;
