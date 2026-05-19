import React, { useState, useEffect } from 'react';
import UserService from '../services/UserService';
import '../styles/UserList.css';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Paginación
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  
  // Estado para la edición
  const [editingId, setEditingId] = useState(null);
  const [editUser, setEditUser] = useState(null);

  const loadData = async (search = '', currentPage = 1) => {
    setLoading(true);
    setError(null);
    try {
      // Pasamos los parámetros de paginación y búsqueda
      const params = { role: 'ciudadano', page: currentPage, limit };
      if (search) params.search = search;
      
      const response = await UserService.getUsers(params);
      
      // Si la respuesta tiene meta (nuestro nuevo backend con paginación)
      if (response && response.meta) {
        setUsers(response.data || []);
        setTotalPages(response.meta.totalPages || 1);
      } else {
        // Fallback si el backend antiguo no retorna meta
        const data = Array.isArray(response) ? response : (response?.data || []);
        setUsers(data.filter(u => u.role === 'ciudadano'));
        setTotalPages(1);
      }
    } catch (err) {
      setError('Error al cargar la lista de usuarios.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setPage(1); // Reset page on new search
      loadData(searchTerm, 1);
    }, 500); // 500ms debounce
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  useEffect(() => {
    // Si cambia de página (y no es por búsqueda)
    if (page > 1 || !searchTerm) {
      loadData(searchTerm, page);
    }
  }, [page]);

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
          // Optimistic update
          const previousUsers = [...users];
          setUsers(users.filter(u => u.id !== id));
          
          try {
            await UserService.deleteUser(id);
            Swal.default.fire('¡Eliminado!', 'El usuario ha sido borrado exitosamente.', 'success');
          } catch (err) {
            // Revert on error
            setUsers(previousUsers);
            Swal.default.fire('Error', 'No se pudo eliminar el usuario.', 'error');
          }
        }
      });
    });
  };

  const handleEditClick = (user) => {
    setEditingId(user.id);
    setEditUser({ ...user });
  };

  const validateUser = (user) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{8}$/;

    if (!user.nombre.trim()) return "El nombre es obligatorio.";
    if (!emailRegex.test(user.email)) return "El formato de correo electrónico no es válido.";
    if (!phoneRegex.test(user.telefono)) return "El teléfono debe tener exactamente 8 dígitos numéricos.";
    
    return null;
  };

  const handleSaveEdit = async (id) => {
    // Basic validation
    const validationError = validateUser(editUser);
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

    // Optimistic update
    const previousUsers = [...users];
    setUsers(users.map(u => u.id === id ? { ...u, ...editUser } : u));
    setEditingId(null);
    setEditUser(null);
    
    try {
      await UserService.updateUser(editUser, id);
      import('sweetalert2').then(Swal => {
        Swal.default.fire('¡Actualizado!', 'Los datos del usuario se modificaron.', 'success');
      });
    } catch (err) {
      // Revert on error
      setUsers(previousUsers);
      import('sweetalert2').then(Swal => Swal.default.fire('Error', 'No se pudo actualizar el usuario.', 'error'));
    }
  };

  return (
    <div className="list-container">
      <div className="list-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 className="section-title">Lista de Usuarios Civiles</h3>
        <div className="search-container">
          <input 
            type="text" 
            placeholder="Buscar por nombre, correo o cédula..." 
            className="inline-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ minWidth: '300px' }}
          />
        </div>
      </div>

      {error && <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

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
            {loading ? (
              <tr><td colSpan="5" className="empty-row-text">Cargando...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan="5" className="empty-row-text">No hay usuarios registrados.</td></tr>
            ) : (
              users.map((user) => (
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
                        <button className="btn-action btn-delete" title="Cancelar" onClick={() => { setEditingId(null); setEditUser(null); }}>
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
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Controles de Paginación */}
      {!loading && totalPages > 1 && (
        <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '1rem' }}>
          <button 
            className="btn-action" 
            disabled={page === 1} 
            onClick={() => setPage(page - 1)}
          >
            Anterior
          </button>
          <span style={{ alignSelf: 'center' }}>Página {page} de {totalPages}</span>
          <button 
            className="btn-action" 
            disabled={page === totalPages} 
            onClick={() => setPage(page + 1)}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
};

export default UserList;
