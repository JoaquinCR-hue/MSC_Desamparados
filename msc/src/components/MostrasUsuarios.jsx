import React, { useState, useEffect } from 'react';
import ServiceUsuarios from '../services/ServiceUsuarios';
import '../styles/MostrasUsuarios.css';

const MostrasUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  
  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editUsr, setEditUsr] = useState(null);

  const loadData = async () => {
    const data = await ServiceUsuarios.getUsuarios();
    if (data) {
      setUsuarios(data.filter(u => u.role === 'ciudadano'));
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
          await ServiceUsuarios.deleteUsuarios(id);
          loadData();
          Swal.default.fire('¡Eliminado!', 'El usuario ha sido borrado exitosamente.', 'success');
        }
      });
    });
  };

  const handleEditClick = (usr) => {
    setEditingId(usr.id);
    setEditUsr({ ...usr });
  };

  const handleSaveEdit = async (id) => {
    await ServiceUsuarios.putUsuarios(editUsr, id);
    setEditingId(null);
    setEditUsr(null);
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
            {usuarios.map((usr) => (
              editingId === usr.id ? (
                <tr key={usr.id} className="edit-row">
                  <td><input type="text" className="inline-input" value={editUsr.nombre} onChange={e => setEditUsr({...editUsr, nombre: e.target.value})} /></td>
                  <td><input type="email" className="inline-input" value={editUsr.email} onChange={e => setEditUsr({...editUsr, email: e.target.value})} /></td>
                  <td><input type="text" className="inline-input" value={editUsr.telefono} onChange={e => setEditUsr({...editUsr, telefono: e.target.value})} /></td>
                  <td><span className="badge-role">{usr.role.toUpperCase()}</span></td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-action btn-save" title="Guardar" onClick={() => handleSaveEdit(usr.id)}>
                        <i className="fa-solid fa-check"></i>
                      </button>
                      <button className="btn-action btn-delete" title="Cancelar" onClick={() => setEditingId(null)}>
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={usr.id}>
                  <td><strong>{usr.nombre}</strong></td>
                  <td>{usr.email}</td>
                  <td>{usr.telefono}</td>
                  <td><span className="badge-role">{usr.role.toUpperCase()}</span></td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-action" title="Editar" onClick={() => handleEditClick(usr)}>
                        <i className="fa-solid fa-pen"></i>
                      </button>
                      <button className="btn-action btn-delete" title="Eliminar" onClick={() => handleDelete(usr.id)}>
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              )
            ))}
            {usuarios.length === 0 && (
              <tr><td colSpan="5" className="empty-row-text">No hay usuarios registrados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MostrasUsuarios;