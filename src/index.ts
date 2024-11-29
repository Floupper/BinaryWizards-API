import app from './app';
const fs = require('fs');
import https from 'https';

// Port number
const httpsPort = Number(process.env.PORT) || 33012;

let sslOptions = {};
if (process.env.APP_ENV === 'server') {
  try {
    sslOptions = {
      key: fs.readFileSync(process.env.key),
      cert: fs.readFileSync(process.env.cert),
    };
    console.log('Certificats SSL chargés avec succès.');
  } catch (err) {
    console.error('Erreur lors du chargement des certificats SSL :', err);
  }
}


// Server starting
if (process.env.APP_ENV === 'server') {
  https.createServer(sslOptions, app).listen(httpsPort, () => {
    console.log(`🚀 Server running on https://localhost:${httpsPort}`);
  });
} else {
  app.listen(httpsPort, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${httpsPort}`);
  });
}
