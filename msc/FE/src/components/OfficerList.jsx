import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import UserService from '../services/UserService';
import '../styles/OfficerList.css';

const OfficerList = ({ initialPage = 1, initialLimit = 10 }) => {
  const [officers, setOfficers] = useState([]);
  const [allOfficers, setAllOfficers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newOfficer, setNewOfficer] = useState({ nombre: '', cedula: '', email: '', telefono: '', role: 'administrador', pass: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(initialPage);
  const [limit] = useState(initialLimit);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();
  const location = useLocation();

  // Estado para la edición
  const [editingId, setEditingId] = useState(null);
  const [editOfficer, setEditOfficer] = useState(null);

  const loadData = async (search = '') => {
    // Traer TODOS los funcionarios sin paginación en backend, paginar localmente
    const params = { limit: 1000 };
    if (search) params.search = search;
    try {
      const response = await UserService.getUsers(params);
      let filtered = [];
      if (response && response.data) {
        const allData = Array.isArray(response.data) ? response.data : response.data;
        filtered = allData.filter(u => u.role !== 'ciudadano');
      } else {
        const data = Array.isArray(response) ? response : (response?.data || []);
        filtered = data.filter(u => u.role !== 'ciudadano');
      }
      setAllOfficers(filtered);
      const pages = Math.ceil(filtered.length / limit) || 1;
      setTotalPages(pages);
      setPage(1); // Reset to page 1 on search
    } catch (err) {
      console.error('Error loading officers', err);
    }
  };

  // Paginar localmente cuando cambia page
  useEffect(() => {
    const start = (page - 1) * limit;
    const end = start + limit;
    setOfficers(allOfficers.slice(start, end));
    // Actualizar URL
    try {
      const params = new URLSearchParams(location.search);
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (searchTerm) params.set('search', searchTerm);
      else params.delete('search');
      navigate(`${location.pathname}?${params.toString()}`, { replace: false });
    } catch (err) {
      // ignore
    }
  }, [page, allOfficers]);

  // Cargar datos al montar o cambiar búsqueda
  useEffect(() => {
    loadData(''); // Cargar todos los funcionarios al montar
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadData(searchTerm);
    }, 500); // 500ms debounce
    // actualizar URL con búsqueda y paginación (si aplica)
    try {
      const params = new URLSearchParams(location.search);
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (searchTerm) params.set('search', searchTerm);
      else params.delete('search');
      navigate(`${location.pathname}?${params.toString()}`, { replace: false });
    } catch (err) {
      // ignore
    }
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
          try {
            await UserService.deleteUser(id);
            loadData(searchTerm);
            Swal.default.fire('¡Eliminado!', 'El funcionario ha sido borrado.', 'success');
          } catch (error) {
            Swal.default.fire('Error', 'No se pudo eliminar el funcionario.', 'error');
          }
        }
      });
    });
  };

  const validateOfficer = (officer, isNew = false) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{8}$/;
    const cedulaRegex = /^\d{9}$/;

    if (!officer.nombre.trim()) return "El nombre es obligatorio.";
    if (!cedulaRegex.test(officer.cedula)) return "La cédula debe tener exactamente 9 dígitos numéricos.";
    if (!emailRegex.test(officer.email)) return "El formato de correo electrónico no es válido.";
    if (!phoneRegex.test(officer.telefono)) return "El teléfono debe tener exactamente 8 dígitos numéricos.";
    if (isNew && officer.pass.length < 6) return "La contraseña debe tener al menos 6 caracteres.";
    
    return null;
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateOfficer(newOfficer, true);
    if (validationError) {
      import('sweetalert2').then(Swal => {
        Swal.default.fire({
          title: 'Error de Validación',
          text: validationError,
          icon: 'warning',
          confirmButtonColor: '#3b82f6'
        });
      });
      return;
    }

    try {
      await UserService.createUser(newOfficer);
      setShowAddForm(false);
      setNewOfficer({ nombre: '', cedula: '', email: '', telefono: '', role: 'administrador', pass: '' });
      loadData(searchTerm);

      import('sweetalert2').then(Swal => {
        Swal.default.fire('¡Agregado!', 'El funcionario ha sido registrado con éxito.', 'success');
      });
    } catch (error) {
      import('sweetalert2').then(Swal => Swal.default.fire('Error', 'No se pudo registrar el funcionario.', 'error'));
    }
  };

  const handleEditClick = (officer) => {
    setEditingId(officer.id);
    setEditOfficer({ ...officer });
  };

  const handleSaveEdit = async (id) => {
    const validationError = validateOfficer(editOfficer, false);
    if (validationError) {
      import('sweetalert2').then(Swal => {
        Swal.default.fire({
          title: 'Error de Validación',
          text: validationError,
          icon: 'warning',
          confirmButtonColor: '#3b82f6'
        });
      });
      return;
    }

    try {
      await UserService.updateUser(editOfficer, id);
      setEditingId(null);
      setEditOfficer(null);
      loadData(searchTerm);
      import('sweetalert2').then(Swal => {
        Swal.default.fire('¡Actualizado!', 'Los datos se modificaron correctamente.', 'success');
      });
    } catch (error) {
      import('sweetalert2').then(Swal => Swal.default.fire('Error', 'No se pudieron actualizar los datos.', 'error'));
    }
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
            <input type="text" placeholder="Cédula (9 dígitos)" maxLength="9" value={newOfficer.cedula} onChange={e => setNewOfficer({ ...newOfficer, cedula: e.target.value.replace(/\D/g, '') })} />
            <input type="email" placeholder="Correo electrónico" value={newOfficer.email} onChange={e => setNewOfficer({ ...newOfficer, email: e.target.value })} />
            <input type="text" placeholder="Teléfono (8 dígitos)" maxLength="8" value={newOfficer.telefono} onChange={e => setNewOfficer({ ...newOfficer, telefono: e.target.value.replace(/\D/g, '') })} />
            <input type="password" placeholder="Contraseña (mín 6 car.)" value={newOfficer.pass} onChange={e => setNewOfficer({ ...newOfficer, pass: e.target.value })} />
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
                  <td><input type="text" className="inline-input" maxLength="9" value={editOfficer.cedula} onChange={e => setEditOfficer({ ...editOfficer, cedula: e.target.value.replace(/\D/g, '') })} /></td>
                  <td><input type="email" className="inline-input" value={editOfficer.email} onChange={e => setEditOfficer({ ...editOfficer, email: e.target.value })} /></td>
                  <td><input type="text" className="inline-input" maxLength="8" value={editOfficer.telefono} onChange={e => setEditOfficer({ ...editOfficer, telefono: e.target.value.replace(/\D/g, '') })} /></td>
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

      {/* Controles de Paginación */}
      {totalPages > 1 && (
        <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '1rem', alignItems: 'center' }}>
          <button 
            className="btn-pagination" 
            disabled={page === 1} 
            onClick={() => setPage(page - 1)}
          >
            ← Anterior
          </button>
          <span style={{ whiteSpace: 'nowrap', color: '#fff', fontWeight: 'bold' }}>Página {page} de {totalPages}</span>
          <button 
            className="btn-pagination" 
            disabled={page === totalPages} 
            onClick={() => setPage(page + 1)}
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
};

export default OfficerList;
