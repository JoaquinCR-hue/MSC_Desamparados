/**
 * Servicio de Geolocalización para Police-IA
 * Proporciona funciones para obtener ubicación del usuario en tiempo real
 */

/**
 * Obtiene la ubicación actual del usuario
 * @returns {Promise<Object>} Promesa que resuelve con {lat, lng, accuracy, timestamp}
 */
export const getUserLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalización no disponible en este navegador'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy, speed, heading } = position.coords;
        resolve({
          lat: latitude,
          lng: longitude,
          accuracy: accuracy,
          speed: speed, // Velocidad en m/s provista por el GPS
          heading: heading, // Rumbo/Orientación nativo en grados
          timestamp: new Date().toISOString()
        });
      },
      (error) => {
        let mensaje = 'Error al obtener ubicación';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            mensaje = 'Permiso de ubicación denegado. Habilita la geolocalización en los ajustes de tu navegador o dispositivo.';
            break;
          case error.POSITION_UNAVAILABLE:
            mensaje = 'El GPS está desactivado o la señal de ubicación no está disponible.';
            break;
          case error.TIMEOUT:
            mensaje = 'Tiempo de espera agotado al intentar geolocalizar.';
            break;
        }
        
        reject(new Error(mensaje));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0 // Forzar lectura directa sin caché
      }
    );
  });
};

/**
 * Inicia monitoreo continuo de ubicación
 * @param {Function} successCallback - Función que se ejecuta cuando la ubicación cambia
 * @param {Function} [errorCallback] - Función que se ejecuta cuando ocurre un error de GPS
 * @returns {number} ID del watch para poder cancelarlo posteriormente
 */
export const watchLocation = (successCallback, errorCallback) => {
  if (!navigator.geolocation) {
    const error = new Error('Geolocalización no disponible en este navegador');
    if (errorCallback) errorCallback(error);
    else console.error(error);
    return null;
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude, accuracy, speed, heading } = position.coords;
      successCallback({
        lat: latitude,
        lng: longitude,
        accuracy: accuracy,
        speed: speed, // Velocidad real en m/s
        heading: heading, // Rumbo nativo en grados
        timestamp: new Date().toISOString()
      });
    },
    (error) => {
      let mensaje = 'Error al monitorear ubicación';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          mensaje = 'Permiso de ubicación denegado por el usuario.';
          break;
        case error.POSITION_UNAVAILABLE:
          mensaje = 'La señal del GPS se ha perdido o está desactivado.';
          break;
        case error.TIMEOUT:
          mensaje = 'Tiempo de espera agotado al actualizar la ubicación.';
          break;
      }
      
      const customError = new Error(mensaje);
      customError.code = error.code;
      
      if (errorCallback) {
        errorCallback(customError);
      } else {
        console.error(mensaje, error);
      }
    },
    {
      enableHighAccuracy: true,
      // Sin timeout: watchPosition es continuo, el timeout solo aplica a getCurrentPosition
      maximumAge: 500 // Acepta posiciones cacheadas de hasta 500ms para evitar cortes en móvil
    }
  );

  return watchId;
};

/**
 * Detiene el monitoreo continuo de ubicación
 * @param {number} watchId - ID del watch retornado por watchLocation()
 */
export const stopWatchLocation = (watchId) => {
  if (watchId !== null && watchId !== undefined) {
    navigator.geolocation.clearWatch(watchId);
  }
};
