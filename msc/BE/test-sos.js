const http = require('http');

const data = JSON.stringify({
  tipo: 'EMERGENCIA',
  descripcion: 'Alerta SOS enviada por el usuario.',
  fecha: new Date().toISOString(),
  id_creador: 1, // asumiendo que admin es 1
  estado: 'Pendiente',
  lat: 9.895459,
  lng: -84.089279,
  distrito: 'Desamparados',
  barrio: 'Centro',
  direccion_exacta: 'Ubicación obtenida por GPS'
});

const options = {
  hostname: '127.0.0.1',
  port: 3000,
  path: '/api/v1/reports',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let body = '';
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    body += chunk;
  });
  res.on('end', () => {
    console.log(`BODY: ${body}`);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
