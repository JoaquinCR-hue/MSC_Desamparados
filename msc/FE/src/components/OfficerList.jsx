import React, { useState, useEffect } from 'react';
import UserService from '../services/UserService';
import '../styles/OfficerList.css';

const OfficerList = () => {
  const [officers, setOfficers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newOfficer, setNewOfficer] = useState({ nombre: '', cedula: '', email: '', telefono: '', role: 'admin', pass: '' });
  const [searchTerm, setSearchTerm] = useState('');

  // Estado para la edición
  const [editingId, setEditingId] = useState(null);
  const [editOfficer, setEditOfficer] = useState(null);

  const loadData = async (search = '') => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const data = await UserService.getUsers(query);
    if (data) {
      // Filtrar para mostrar solo aquellos que no son ciudadanos
      setOfficers(data.filter(u => u.role !== 'ciudadano'));
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadData(searchTerm);
    }, 500); // 500ms debounce
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleDelete = async (id) => {
    import('sweetalert2').then(Swal => {
      Swal.default.fire({
        title: '¿Eliminar Funcionario?',
        text: "Esta acción no se puede deshacer.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#334155',
        confirmButtonText: 'Sí, eliminar'
      }).then(async (result) => {
        if (result.isConfirmed) {
          await UserService.deleteUser(id);
          loadData(searchTerm);
          Swal.default.fire('¡Eliminado!', 'El funcionario ha sido borrado.', 'success');
        }
      });
    });
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();

    // Validaciones de campos
    if (!newOfficer.nombre || !newOfficer.cedula || !newOfficer.email || !newOfficer.telefono || !newOfficer.pass) {
      import('sweetalert2').then(Swal => {
        Swal.default.fire({
          title: 'Campos Incompletos',
          text: 'Por favor, rellene todos los campos del funcionario.',
          icon: 'warning',
          confirmButtonColor: '#3b82f6'
        });
      });
      return;
    }

    const officerData = {
      ...newOfficer,
      id: Math.random().toString(16).slice(2, 6)
    };
    await UserService.createUser(officerData);
    setShowAddForm(false);
    setNewOfficer({ nombre: '', cedula: '', email: '', telefono: '', role: 'admin', pass: '' });
    loadData(searchTerm);

    import('sweetalert2').then(Swal => {
      Swal.default.fire('¡Agregado!', 'El funcionario ha sido registrado con éxito.', 'success');
    });
  };

  const handleEditClick = (officer) => {
    setEditingId(officer.id);
    setEditOfficer({ ...officer });
  };

  const handleSaveEdit = async (id) => {
    // Validaciones de edición
    if (!editOfficer.nombre || !editOfficer.cedula || !editOfficer.email || !editOfficer.telefono) {
      import('sweetalert2').then(Swal => {
        Swal.default.fire({
          title: 'Campos Incompletos',
          text: 'No puede dejar campos vacíos al editar el funcionario.',
          icon: 'warning',
          confirmButtonColor: '#3b82f6'
        });
      });
      return;
    }

    await UserService.updateUser(editOfficer, id);
    setEditingId(null);
    setEditOfficer(null);
    loadData(searchTerm);
    import('sweetalert2').then(Swal => {
      Swal.default.fire('¡Actualizado!', 'Los datos se modificaron correctamente.', 'success');
    });
  };

  return (
    <div className="list-container">
      <div className="list-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 className="section-title">Lista de Funcionarios</h3>
        <div className="search-container" style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            placeholder="Buscar por nombre, correo o cédula..." 
            className="inline-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ minWidth: '300px' }}
          />
          <button className="btn-new" onClick={() => setShowAddForm(!showAddForm)}>
            <i className={`fa-solid ${showAddForm ? 'fa-xmark' : 'fa-user-plus'}`}></i> {showAddForm ? 'CANCELAR' : 'NUEVO FUNCIONARIO'}
          </button>
        </div>
      </div>

      {showAddForm && (
        <form className="add-form" onSubmit={handleAddSubmit}>
          <h4>Agregar Nuevo Funcionario</h4>
          <div className="form-grid">
            <input type="text" placeholder="Nombre completo" value={newOfficer.nombre} onChange={e => setNewOfficer({ ...newOfficer, nombre: e.target.value })} />
            <input type="text" placeholder="Cédula" value={newOfficer.cedula} onChange={e => setNewOfficer({ ...newOfficer, cedula: e.target.value })} />
            <input type="email" placeholder="Correo electrónico" value={newOfficer.email} onChange={e => setNewOfficer({ ...newOfficer, email: e.target.value })} />
            <input type="text" placeholder="Teléfono" value={newOfficer.telefono} onChange={e => setNewOfficer({ ...newOfficer, telefono: e.target.value })} />
            <input type="password" placeholder="Contraseña" value={newOfficer.pass} onChange={e => setNewOfficer({ ...newOfficer, pass: e.target.value })} />
            <select value={newOfficer.role} onChange={e => setNewOfficer({ ...newOfficer, role: e.target.value })}>
              <option value="admin">Administrador</option>
              <option value="funcionario">Funcionario</option>
            </select>
            <button type="submit" className="btn-submit">Guardar</button>
          </div>
        </form>
      )}

      <div className="table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              <th>NOMBRE</th>
              <th>CÉDULA</th>
              <th>CORREO</th>
              <th>TELÉFONO</th>
              <th>ROL</th>
              <th>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {officers.map((officer) => (
              editingId === officer.id ? (
                <tr key={officer.id} className="edit-row">
                  <td><input type="text" className="inline-input" value={editOfficer.nombre} onChange={e => setEditOfficer({ ...editOfficer, nombre: e.target.value })} /></td>
                  <td><input type="text" className="inline-input" value={editOfficer.cedula} onChange={e => setEditOfficer({ ...editOfficer, cedula: e.target.value })} /></td>
                  <td><input type="email" className="inline-input" value={editOfficer.email} onChange={e => setEditOfficer({ ...editOfficer, email: e.target.value })} /></td>
                  <td><input type="text" className="inline-input" value={editOfficer.telefono} onChange={e => setEditOfficer({ ...editOfficer, telefono: e.target.value })} /></td>
                  <td>
                    <select className="inline-input" value={editOfficer.role} onChange={e => setEditOfficer({ ...editOfficer, role: e.target.value })}>
                      <option value="admin">Admin</option>
                      <option value="funcionario">Funcionario</option>
                    </select>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-action btn-save" title="Guardar" onClick={() => handleSaveEdit(officer.id)}>
                        <i className="fa-solid fa-check"></i>
                      </button>
                      <button className="btn-action btn-delete" title="Cancelar" onClick={() => setEditingId(null)}>
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={officer.id}>
                  <td><strong>{officer.nombre}</strong></td>
                  <td>{officer.cedula}</td>
                  <td>{officer.email}</td>
                  <td>{officer.telefono}</td>
                  <td><span className="badge-role">{officer.role.toUpperCase()}</span></td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-action" title="Editar" onClick={() => handleEditClick(officer)}>
                        <i className="fa-solid fa-pen"></i>
                      </button>
                      <button className="btn-action btn-delete" title="Eliminar" onClick={() => handleDelete(officer.id)}>
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              )
            ))}
            {officers.length === 0 && (
              <tr><td colSpan="6" className="empty-row-text">No hay funcionarios registrados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OfficerList;
