import React, { useState, useEffect } from 'react';
import ServiceUsuarios from '../services/ServiceUsuarios';
import '../styles/MostrarFuncionario.css';

const MostrarFuncionario = () => {
  const [funcionarios, setFuncionarios] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFunc, setNewFunc] = useState({ nombre: '', cedula: '', email: '', telefono: '', role: 'admin', pass: '' });

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editFunc, setEditFunc] = useState(null);

  const loadData = async () => {
    const data = await ServiceUsuarios.getUsuarios();
    if (data) {
      setFuncionarios(data.filter(u => u.role !== 'ciudadano'));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
          await ServiceUsuarios.deleteUsuarios(id);
          loadData();
          Swal.default.fire('¡Eliminado!', 'El funcionario ha sido borrado.', 'success');
        }
      });
    });
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();

    // Validaciones
    if (!newFunc.nombre || !newFunc.cedula || !newFunc.email || !newFunc.telefono || !newFunc.pass) {
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

    const funcData = {
      ...newFunc,
      id: Math.random().toString(16).slice(2, 6)
    };
    await ServiceUsuarios.postUsuarios(funcData);
    setShowAddForm(false);
    setNewFunc({ nombre: '', cedula: '', email: '', telefono: '', role: 'admin', pass: '' });
    loadData();

    import('sweetalert2').then(Swal => {
      Swal.default.fire('¡Agregado!', 'El funcionario ha sido registrado con éxito.', 'success');
    });
  };

  const handleEditClick = (func) => {
    setEditingId(func.id);
    setEditFunc({ ...func });
  };

  const handleSaveEdit = async (id) => {
    // Validaciones
    if (!editFunc.nombre || !editFunc.cedula || !editFunc.email || !editFunc.telefono) {
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

    await ServiceUsuarios.putUsuarios(editFunc, id);
    setEditingId(null);
    setEditFunc(null);
    loadData();
    import('sweetalert2').then(Swal => {
      Swal.default.fire('¡Actualizado!', 'Los datos se modificaron correctamente.', 'success');
    });
  };

  return (
    <div className="list-container">
      <div className="list-controls">
        <h3 className="section-title">Lista de Funcionarios</h3>
        <button className="btn-new" onClick={() => setShowAddForm(!showAddForm)}>
          <i className={`fa-solid ${showAddForm ? 'fa-xmark' : 'fa-user-plus'}`}></i> {showAddForm ? 'CANCELAR' : 'NUEVO FUNCIONARIO'}
        </button>
      </div>

      {showAddForm && (
        <form className="add-form" onSubmit={handleAddSubmit}>
          <h4>Agregar Nuevo Funcionario</h4>
          <div className="form-grid">
            <input type="text" placeholder="Nombre completo" value={newFunc.nombre} onChange={e => setNewFunc({ ...newFunc, nombre: e.target.value })} />
            <input type="text" placeholder="Cedula" value={newFunc.cedula} onChange={e => setNewFunc({ ...newFunc, cedula: e.target.value })} />
            <input type="email" placeholder="Correo electrónico" value={newFunc.email} onChange={e => setNewFunc({ ...newFunc, email: e.target.value })} />
            <input type="text" placeholder="Teléfono" value={newFunc.telefono} onChange={e => setNewFunc({ ...newFunc, telefono: e.target.value })} />
            <input type="password" placeholder="Contraseña" value={newFunc.pass} onChange={e => setNewFunc({ ...newFunc, pass: e.target.value })} />
            <select value={newFunc.role} onChange={e => setNewFunc({ ...newFunc, role: e.target.value })}>
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
              <th>CEDULA</th>
              <th>CORREO</th>
              <th>TELÉFONO</th>
              <th>ROL</th>
              <th>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {funcionarios.map((func) => (
              editingId === func.id ? (
                <tr key={func.id} className="edit-row">
                  <td><input type="text" className="inline-input" value={editFunc.nombre} onChange={e => setEditFunc({ ...editFunc, nombre: e.target.value })} /></td>
                  <td><input type="text" className="inline-input" value={editFunc.cedula} onChange={e => setEditFunc({ ...editFunc, cedula: e.target.value })} /></td>
                  <td><input type="email" className="inline-input" value={editFunc.email} onChange={e => setEditFunc({ ...editFunc, email: e.target.value })} /></td>
                  <td><input type="text" className="inline-input" value={editFunc.telefono} onChange={e => setEditFunc({ ...editFunc, telefono: e.target.value })} /></td>
                  <td>
                    <select className="inline-input" value={editFunc.role} onChange={e => setEditFunc({ ...editFunc, role: e.target.value })}>
                      <option value="admin">Admin</option>
                      <option value="funcionario">Funcionario</option>
                    </select>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-action btn-save" title="Guardar" onClick={() => handleSaveEdit(func.id)}>
                        <i className="fa-solid fa-check"></i>
                      </button>
                      <button className="btn-action btn-delete" title="Cancelar" onClick={() => setEditingId(null)}>
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={func.id}>
                  <td><strong>{func.nombre}</strong></td>
                  <td>{func.cedula}</td>
                  <td>{func.email}</td>
                  <td>{func.telefono}</td>
                  <td><span className="badge-role">{func.role.toUpperCase()}</span></td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-action" title="Editar" onClick={() => handleEditClick(func)}>
                        <i className="fa-solid fa-pen"></i>
                      </button>
                      <button className="btn-action btn-delete" title="Eliminar" onClick={() => handleDelete(func.id)}>
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              )
            ))}
            {funcionarios.length === 0 && (
              <tr><td colSpan="5" className="empty-row-text">No hay funcionarios registrados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MostrarFuncionario;