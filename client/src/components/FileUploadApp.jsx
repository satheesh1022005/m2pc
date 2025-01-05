import React, { useState } from "react";
import axios from "axios";

function FileUploadApp() {
  const [serverUrl, setServerUrl] = useState("http://192.168.217.157:3000");
  const [file, setFile] = useState(null);

  // Handle file selection
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!serverUrl || !file) {
      alert("Please scan the QR code and select a file!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(`${serverUrl}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert(response.data);
    } catch (error) {
      alert("File upload failed!");
    }
  };

  // Simulate QR code scan (for demo purposes)
  const simulateQrScan = () => {
    setServerUrl("http://192.168.217.157:3000"); // Replace with actual IP
  };

  return (
    <div>
      <h1>File Upload App</h1>
      <button onClick={simulateQrScan}>Simulate QR Scan</button>
      <p>Server URL: {serverUrl || "Not scanned yet"}</p>

      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload File</button>
    </div>
  );
}

export default FileUploadApp;
