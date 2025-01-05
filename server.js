// Import the QRCode module
const QRCode = require('qrcode');
const fs = require('fs');

// Define Wi-Fi connection details
const wifiDetails = {
  ssid: 'YourWiFiSSID', // Replace with your Wi-Fi SSID
  password: 'YourWiFiPassword', // Replace with your Wi-Fi password
  encryption: 'WPA', // Encryption type: WPA, WEP, or nopass for open networks
  hidden: 'false', // 'true' for hidden networks, 'false' otherwise
};

// Format Wi-Fi details into a QR code string
const wifiConfig = `WIFI:T:${wifiDetails.encryption};S:${wifiDetails.ssid};P:${wifiDetails.password};H:${wifiDetails.hidden};;`;

// Function to generate and save the QR code
function generateWiFiQRCode() {
  const outputFilePath = './wifi-qr.png'; // Path where the QR code image will be saved

  QRCode.toFile(outputFilePath, wifiConfig, { width: 300 }, (err) => {
    if (err) {
      console.error('Error generating QR code:', err);
    } else {
      console.log(`Wi-Fi QR code generated successfully: ${outputFilePath}`);
    }
  });
}

// Create a server to serve the QR code for easy access
function startServer() {
  const express = require('express');
  const app = express();
  const PORT = 3000;

  // Serve the QR code image
  app.get('/wifi-qr', (req, res) => {
    const filePath = './wifi-qr.png';
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath, { root: __dirname });
    } else {
      res.send('QR Code not generated yet. Run the script again!');
    }
  });

  // Start the server
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/wifi-qr`);
  });
}

// Generate the QR code and start the server
generateWiFiQRCode();
startServer();
