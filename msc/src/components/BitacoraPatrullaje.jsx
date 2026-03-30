import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import ServicePolicia from '../services/ServicePolicia';
import '../styles/BitacoraPatrullaje.css';

const DISTRICT_COORDS = {
  "Desamparados": [9.892, -84.050],
  "San Miguel": [9.878, -84.058],
  "San Juan de Dios": [9.882, -84.072],
  "San Rafael Arriba": [9.888, -84.078],
  "San Antonio": [9.885, -84.032],
  "Frailes": [9.749, -84.015],
  "Patarrá": [9.880, -84.008],
  "San Cristóbal": [9.771, -83.978],
  "Rosario": [9.791, -84.004],
  "Damas": [9.896, -84.041],
  "San Rafael Abajo": [9.896, -84.088],
  "Gravilias": [9.882, -84.051],
  "Los Guido": [9.865, -84.045]
};

const BitacoraPatrullaje = ({ refreshTrigger, onGlobalUpdate }) => {
  const [patrullas, setPatrullas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Verificación sincrónica de RBAC
  const userStr = sessionStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : {};
  const isAdmin = currentUser.role === 'admin';

  const fetchDatos = async () => {
    try {
      const dataPol = await ServicePolicia.getPolicias();
      setPatrullas(dataPol || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data: ", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatos();
  }, [refreshTrigger]);

  const handleEdit = async (patrulla) => {
    const horarioStr = patrulla.horario || '';
    const [hInicio, hFin] = horarioStr.includes(' - ') ? horarioStr.split(' - ') : ['', ''];

    const { value: formValues } = await Swal.fire({
      title: `Editar U-${patrulla.unidad}`,
      html: `
        <label class="text-main fw-bold mb-1 w-100 text-start">Estado Operativo</label>
        <select id="swal-estado" class="form-select bg-main text-main border-secondary mb-3">
          <option value="Activa" ${patrulla.estado === 'Activa' ? 'selected' : ''}>Activa / Patrullando</option>
          <option value="Inactiva" ${patrulla.estado === 'Inactiva' ? 'selected' : ''}>Inactiva / En Estación</option>
          <option value="En Incidente" ${patrulla.estado === 'En Incidente' ? 'selected' : ''}>En Incidente</option>
        </select>

        <label class="text-main fw-bold mb-1 w-100 text-start">Horario de Turno (Militar)</label>
        <div class="d-flex gap-2 mb-3">
          <input type="time" id="swal-hora-inicio" class="form-control bg-main text-main border-secondary" value="${hInicio}">
          <span class="text-main align-self-center fw-bold">-</span>
          <input type="time" id="swal-hora-fin" class="form-control bg-main text-main border-secondary" value="${hFin}">
        </div>
        
        <label class="text-main fw-bold mb-1 w-100 text-start">Distrito / Zona</label>
        <select id="swal-zona" class="form-select bg-main text-main border-secondary mb-3">
          <option value="Desamparados" ${patrulla.zona === 'Desamparados' ? 'selected' : ''}>Desamparados (1)</option>
          <option value="San Miguel" ${patrulla.zona === 'San Miguel' ? 'selected' : ''}>San Miguel (2)</option>
          <option value="San Juan de Dios" ${patrulla.zona === 'San Juan de Dios' ? 'selected' : ''}>San Juan de Dios (3)</option>
          <option value="San Rafael Arriba" ${patrulla.zona === 'San Rafael Arriba' ? 'selected' : ''}>San Rafael Arriba (4)</option>
          <option value="San Antonio" ${patrulla.zona === 'San Antonio' ? 'selected' : ''}>San Antonio (5)</option>
          <option value="Frailes" ${patrulla.zona === 'Frailes' ? 'selected' : ''}>Frailes (6)</option>
          <option value="Patarrá" ${patrulla.zona === 'Patarrá' ? 'selected' : ''}>Patarrá (7)</option>
          <option value="San Cristóbal" ${patrulla.zona === 'San Cristóbal' ? 'selected' : ''}>San Cristóbal (8)</option>
          <option value="Rosario" ${patrulla.zona === 'Rosario' ? 'selected' : ''}>Rosario (9)</option>
          <option value="Damas" ${patrulla.zona === 'Damas' ? 'selected' : ''}>Damas (10)</option>
          <option value="San Rafael Abajo" ${patrulla.zona === 'San Rafael Abajo' ? 'selected' : ''}>San Rafael Abajo (11)</option>
          <option value="Gravilias" ${patrulla.zona === 'Gravilias' ? 'selected' : ''}>Gravilias (12)</option>
          <option value="Los Guido" ${patrulla.zona === 'Los Guido' ? 'selected' : ''}>Los Guido (13)</option>
        </select>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      background: 'var(--bg-secondary)', 
      color: 'var(--text-main)',
      customClass: {
        popup: 'premium-border',
        confirmButton: 'btn btn-primary premium-btn me-2',
        cancelButton: 'btn btn-outline-secondary'
      },
      buttonsStyling: false,
      preConfirm: () => {
        const estado = document.getElementById('swal-estado').value;
        const hInicio = document.getElementById('swal-hora-inicio').value;
        const hFin = document.getElementById('swal-hora-fin').value;
        const zona = document.getElementById('swal-zona').value;

        if (!hInicio || !hFin) {
          Swal.showValidationMessage('Ambas horas de turno son obligatorias');
          return false;
        }

        return {
          estado,
          horario: `${hInicio} - ${hFin}`,
          zona
        };
      }
    });

    if (formValues) {
      const updated = { ...patrulla, estado: formValues.estado, horario: formValues.horario, zona: formValues.zona };
      
      // Si se cambió la zona, movemos automáticamente la unidad al centro de ese nuevo distrito
      if (formValues.zona !== patrulla.zona && DISTRICT_COORDS[formValues.zona]) {
        updated.lat = DISTRICT_COORDS[formValues.zona][0];
        updated.lng = DISTRICT_COORDS[formValues.zona][1];
      }

      await ServicePolicia.putPolicias(updated, patrulla.id);
      Swal.fire({icon: 'success', title: 'Actualizado', timer: 1500, showConfirmButton: false, background: 'var(--bg-secondary)', color: 'var(--text-main)'});
      fetchDatos();
      if (onGlobalUpdate) onGlobalUpdate();
    }
  };

  const handleAddUnit = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Añadir Nueva Unidad',
      html: `
        <label class="text-main fw-bold mb-1 w-100 text-start">Número de Unidad</label>
        <input id="swal-unidad" class="form-control bg-main text-main border-secondary mb-3" placeholder="Ej. 304">
        
        <label class="text-main fw-bold mb-1 w-100 text-start">Oficiales a cargo</label>
        <input id="swal-oficiales" class="form-control bg-main text-main border-secondary mb-3" placeholder="Nombres">
        
        <label class="text-main fw-bold mb-1 w-100 text-start">Tipo de Unidad</label>
        <select id="swal-tipo" class="form-select bg-main text-main border-secondary mb-3">
          <option value="Patrulla">🚗 Patrulla (Automóvil)</option>
          <option value="Motocicleta">🏍️ Motocicleta</option>
        </select>

        <label class="text-main fw-bold mb-1 w-100 text-start">Distrito Inicial</label>
        <select id="swal-zona" class="form-select bg-main text-main border-secondary mb-3">
          <option value="Desamparados">Desamparados</option>
          <option value="San Miguel">San Miguel</option>
          <option value="San Juan de Dios">San Juan de Dios</option>
          <option value="San Rafael Arriba">San Rafael Arriba</option>
          <option value="San Antonio">San Antonio</option>
          <option value="Frailes">Frailes</option>
          <option value="Patarrá">Patarrá</option>
          <option value="San Cristóbal">San Cristóbal</option>
          <option value="Rosario">Rosario</option>
          <option value="Damas">Damas</option>
          <option value="San Rafael Abajo">San Rafael Abajo</option>
          <option value="Gravilias">Gravilias</option>
          <option value="Los Guido">Los Guido</option>
        </select>

        <label class="text-main fw-bold mb-1 w-100 text-start">Horario de Turno (Militar)</label>
        <div class="d-flex gap-2 mb-3">
          <input type="time" id="swal-hora-inicio" class="form-control bg-main text-main border-secondary">
          <span class="text-main align-self-center fw-bold">-</span>
          <input type="time" id="swal-hora-fin" class="form-control bg-main text-main border-secondary">
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Desplegar Unidad',
      cancelButtonText: 'Cancelar',
      background: 'var(--bg-secondary)', 
      color: 'var(--text-main)',
      customClass: {
        popup: 'premium-border',
        confirmButton: 'btn btn-primary premium-btn me-2',
        cancelButton: 'btn btn-outline-secondary'
      },
      buttonsStyling: false,
      preConfirm: () => {
        const unidad = document.getElementById('swal-unidad').value;
        const oficiales = document.getElementById('swal-oficiales').value;
        const tipo = document.getElementById('swal-tipo').value;
        const zona = document.getElementById('swal-zona').value;
        const hInicio = document.getElementById('swal-hora-inicio').value;
        const hFin = document.getElementById('swal-hora-fin').value;

        if (!unidad || !oficiales || !hInicio || !hFin) {
          Swal.showValidationMessage('Debe completar unidad, oficiales y un horario válido');
          return false;
        }

        return { unidad, oficiales, tipo, zona, horario: `${hInicio} - ${hFin}` };
      }
    });

    if (formValues) {
      const { unidad, oficiales, tipo, zona, horario } = formValues;
      const [lat, lng] = DISTRICT_COORDS[zona] || DISTRICT_COORDS["Desamparados"];
      
      const newPatrol = {
        id: Date.now().toString(),
        unidad,
        nombre_oficiales: oficiales,
        tipo_unidad: tipo,
        zona,
        horario,
        estado: 'Activa',
        lat,
        lng
      };

      await ServicePolicia.postPolicias(newPatrol);
      Swal.fire({icon: 'success', title: 'Unidad Desplegada', text: `La U-${unidad} ha sido desplegada en ${zona}.`, timer: 2000, showConfirmButton: false, background: 'var(--bg-secondary)', color: 'var(--text-main)'});
      fetchDatos();
      if (onGlobalUpdate) onGlobalUpdate();
    }
  };

  const handleToggleStatus = async (patrulla) => {
    const newStatus = patrulla.estado === 'Activa' ? 'Inactiva' : 'Activa';
    const updated = { ...patrulla, estado: newStatus };
    await ServicePolicia.putPolicias(updated, patrulla.id);
    fetchDatos();
    if (onGlobalUpdate) onGlobalUpdate();
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: '¿Retirar Unidad?',
      text: "La unidad desaparecerá de la bitácora y del mapa.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, retirar',
      cancelButtonText: 'Cancelar',
      background: 'var(--bg-secondary)', 
      color: 'var(--text-main)',
      customClass: {
        popup: 'premium-border',
        confirmButton: 'btn btn-danger me-2',
        cancelButton: 'btn btn-outline-secondary'
      },
      buttonsStyling: false
    });

    if (result.isConfirmed) {
      await ServicePolicia.deletePolicias(id);
      Swal.fire({icon: 'success', title: 'Retirada', timer: 1500, showConfirmButton: false, background: 'var(--bg-secondary)', color: 'var(--text-main)'});
      fetchDatos();
      if (onGlobalUpdate) onGlobalUpdate();
    }
  };

  if (loading) {
    return (
      <div className="bitacora-container premium-card p-4 mt-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-2 text-muted">Cargando bitácora de patrullaje...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bitacora-container premium-card p-4 mt-4 cont-temas">
      <div className="bitacora-header d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-3">
          <h4 className="mb-0 bitacora-title">
            <i className="fa-solid fa-clipboard-list text-primary me-2"></i> 
            Bitácora de Unidades en Servicio
          </h4>
          <span className="badge bg-secondary rounded-pill px-3 py-2">
            Total Desplegadas: {patrullas.length}
          </span>
        </div>
        {isAdmin && (
          <button className="btn btn-primary premium-btn px-4" onClick={handleAddUnit}>
            <i className="fa-solid fa-plus me-2"></i> Nueva Unidad
          </button>
        )}
      </div>

      <div className="table-responsive table-wrapper-premium">
        <table className="table table-premium table-hover align-middle">
          <thead>
            <tr>
              <th scope="col">ID Unidad</th>
              <th scope="col">Tipo</th>
              <th scope="col">Oficiales Asignados</th>
              <th scope="col">Horario</th>
              <th scope="col">Distrito</th>
              <th scope="col">Estado</th>
              {isAdmin && <th scope="col" className="text-center">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {patrullas.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? "7" : "6"} className="text-center text-muted py-4">
                  <i className="fa-solid fa-folder-open fs-3 mb-2 opacity-50"></i>
                  <p className="mb-0">No hay unidades registradas en la bitácora actualmente.</p>
                </td>
              </tr>
            ) : (
              patrullas.map(patrulla => (
                <tr key={patrulla.id}>
                  <td className="fw-bold">U-{patrulla.unidad}</td>
                  <td>
                    {patrulla.tipo_unidad === 'Motocicleta' ? (
                      <span className="badge bg-dark-subtle text-dark border"><i className="fa-solid fa-motorcycle"></i> Moto</span>
                    ) : (
                      <span className="badge bg-primary-subtle text-primary border"><i className="fa-solid fa-truck-fast"></i> Patrulla</span>
                    )}
                  </td>
                  <td>{patrulla.nombre_oficiales}</td>
                  <td>
                    <i className="fa-regular fa-clock text-muted"></i> {patrulla.horario || 'No especificado'}
                  </td>
                  <td><i className="fa-solid fa-location-dot text-danger opacity-75"></i> {patrulla.zona || 'Centro'}</td>
                  <td>
                    <span className={`badge ${patrulla.estado === 'Activa' ? 'bg-success' : patrulla.estado === 'Inactiva' ? 'bg-warning text-dark' : 'bg-danger'}`}>
                      {patrulla.estado}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="text-center">
                      <button 
                        className={`btn btn-sm me-2 ${patrulla.estado === 'Activa' ? 'btn-outline-warning' : 'btn-outline-success'}`} 
                        onClick={() => handleToggleStatus(patrulla)} 
                        title={patrulla.estado === 'Activa' ? 'Desactivar Unidad' : 'Activar Unidad'}>
                        <i className={`fa-solid ${patrulla.estado === 'Activa' ? 'fa-power-off' : 'fa-check'}`}></i>
                      </button>
                      <button className="btn btn-sm btn-outline-info me-2" onClick={() => handleEdit(patrulla)} title="Editar Horario/Distrito">
                        <i className="fa-solid fa-pen"></i>
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(patrulla.id)} title="Retirar Unidad">
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BitacoraPatrullaje;
