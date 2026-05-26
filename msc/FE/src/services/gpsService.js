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
        const { latitude, longitude, accuracy } = position.coords;
        resolve({
          lat: latitude,
          lng: longitude,
          accuracy: accuracy,
          timestamp: new Date().toISOString()
        });
      },
      (error) => {
        let mensaje = 'Error al obtener ubicación';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            mensaje = 'Permiso de ubicación denegado. Habilita la geolocalización en tu navegador.';
            break;
          case error.POSITION_UNAVAILABLE:
            mensaje = 'Ubicación no disponible. Intenta en otro lugar.';
            break;
          case error.TIMEOUT:
            mensaje = 'Tiempo de espera agotado al obtener ubicación.';
            break;
        }
        
        reject(new Error(mensaje));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
};

/**
 * Inicia monitoreo continuo de ubicación
 * @param {Function} callback - Función que se ejecuta cuando la ubicación cambia
 * @returns {number} ID del watch para poder cancelarlo posteriormente
 */
export const watchLocation = (callback) => {
  if (!navigator.geolocation) {
    console.error('Geolocalización no disponible en este navegador');
    return null;
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      callback({
        lat: latitude,
        lng: longitude,
        accuracy: accuracy,
        timestamp: new Date().toISOString()
      });
    },
    (error) => {
      let mensaje = 'Error al monitorear ubicación';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          mensaje = 'Permiso de ubicación denegado.';
          break;
        case error.POSITION_UNAVAILABLE:
          mensaje = 'Ubicación no disponible.';
          break;
        case error.TIMEOUT:
          mensaje = 'Tiempo de espera agotado.';
          break;
      }
      
      console.error(mensaje, error);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 1000
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
