import React, { useState } from "react";
import QRCode from "react-qr-code";
import axios from "axios";
import "./SettingsPage.css"; // Plain CSS file for styling

const SettingsPage = ({ ip }) => {
  const [wifiDetails, setWifiDetails] = useState({ ssid: "", password: "" });
  const [webDetails, setWebDetails] = useState({ ip: "", port: "" });
  const [qrCodeData, setQrCodeData] = useState("");
  const [ipqrCodeData, setIpQrCodeData] = useState("");
  const [pricing, setPricing] = useState({ blackPrice: 1, colorPrice: 5 });

  // Handle input changes
  const handleInputChange = (e, setState) => {
    const { name, value } = e.target;
    setState((prev) => ({ ...prev, [name]: value }));
  };
  // Generate WiFi QR Code
  const generateWifiQr = () => {
    const qrData = `WIFI:S:${wifiDetails.ssid};T:WPA;P:${wifiDetails.password};;`;
    setQrCodeData(qrData);
  };

  // Generate Web Page QR Code
  const generateWebQr = () => {
    const qrData = `http://${webDetails.ip}:${webDetails.port}`;
    setIpQrCodeData(qrData);
  };

  // Update Pricing
  const updatePricing = async () => {
    console.log(ip);
    try {
      await axios.post(`http://${ip}:3000/update-pricing`, pricing);
      alert("Pricing updated successfully!");
    } catch (error) {
      console.error("Error updating pricing:", error);
      alert("Failed to update pricing!");
    }
  };

  return (
    <div className="settings-container">
      <h1>Photocopy Shop Settings</h1>

      {/* QR Code Section */}
      <div className="section">
        <h2>QR Code Generation</h2>
        <div className="form-group">
          <h3>WiFi QR Code</h3>
          <input
            type="text"
            name="ssid"
            placeholder="WiFi SSID"
            value={wifiDetails.ssid}
            onChange={(e) => handleInputChange(e, setWifiDetails)}
          />
          <input
            type="password"
            name="password"
            placeholder="WiFi Password"
            value={wifiDetails.password}
            onChange={(e) => handleInputChange(e, setWifiDetails)}
          />
          <button onClick={generateWifiQr}>Generate WiFi QR Code</button>
        </div>
        {qrCodeData && (
          <div className="qr-code">
            <h3>Generated QR Code:</h3>
            <QRCode value={qrCodeData} size={150} />
          </div>
        )}

        <div className="form-group">
          <h3>Web Page QR Code</h3>
          <input
            type="text"
            name="ip"
            placeholder="IP Address"
            value={webDetails.ip}
            onChange={(e) => handleInputChange(e, setWebDetails)}
          />
          <input
            type="text"
            name="port"
            placeholder="Port"
            value={webDetails.port}
            onChange={(e) => handleInputChange(e, setWebDetails)}
          />
          <button onClick={generateWebQr}>Generate Web QR Code</button>
        </div>
        {ipqrCodeData && (
          <div className="qr-code">
            <h3>Generated QR Code:</h3>
            <QRCode value={ipqrCodeData} size={150} />
          </div>
        )}
      </div>

      {/* Pricing Section */}
      <div className="section">
        <h2>Pricing</h2>
        <div className="form-group">
          <label>Black & White Price (₹):</label>
          <input
            type="number"
            name="blackPrice"
            value={pricing.black}
            onChange={(e) => handleInputChange(e, setPricing)}
          />
        </div>
        <div className="form-group">
          <label>Color Price (₹):</label>
          <input
            type="number"
            name="colorPrice"
            value={pricing.color}
            onChange={(e) => handleInputChange(e, setPricing)}
          />
        </div>
        <button onClick={updatePricing}>Update Pricing</button>
      </div>
    </div>
  );
};

export default SettingsPage;
