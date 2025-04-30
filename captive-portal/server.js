const express = require('express');
const os = require('os');
const app = express();
const PORT = 80;

// Function to get your local hotspot IP
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (let iface in interfaces) {
    for (let config of interfaces[iface]) {
      if (config.family === 'IPv4' && !config.internal) {
        return config.address;
      }
    }
  }
  return '127.0.0.1';
}

// Middleware: Redirect all HTTP requests to React app
app.use((req, res) => {
  const serverIP = getLocalIP();
  res.redirect(302, `http://${serverIP}:5173`);
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`📡 Captive portal active on port ${PORT}`);
  console.log(`🌐 React app redirecting to: http://${getLocalIP()}:5173`);
});
