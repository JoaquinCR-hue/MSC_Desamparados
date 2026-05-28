// src/components/ImageUpload.jsx
import React, { useRef } from 'react';
import Swal from 'sweetalert2';

const ImageUpload = ({
  currentImage,
  onUpload,
  uploading,
  defaultAvatar
}) => {

  const fileInputRef = useRef(null);

  const triggerInput = () => {
    fileInputRef.current?.click();
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    // Validaciones
    if (!file.type.startsWith('image/')) {
      Swal.fire('Error', 'Debe seleccionar una imagen', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      Swal.fire('Error', 'Máximo permitido: 5MB', 'error');
      return;
    }

    onUpload(file);

    fileInputRef.current.value = '';
  };

  return (
    <div className="perfil-avatar-section mb-4">
      <div className="avatar-wrapper">
        <img
          src={currentImage || defaultAvatar}
          alt="Foto perfil"
          className="avatar-img"
        />

        <button
          type="button"
          className="avatar-upload-btn"
          onClick={triggerInput}
          disabled={uploading}
        >
          {
            uploading
              ? <i className="fa-solid fa-spinner fa-spin"></i>
              : <i className="fa-solid fa-camera"></i>
          }
        </button>

        <input
          type="file"
          hidden
          ref={fileInputRef}
          accept="image/*"
          onChange={handleFile}
        />
      </div>
    </div>
  );
};

export default ImageUpload;