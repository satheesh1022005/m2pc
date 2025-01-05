import React, { useState, useEffect, useMemo } from "react";
import { io } from "socket.io-client";

function FileUploadApp({ ip }) {
  const [socket, setSocket] = useState(null);

  // Initialize socket connection inside useEffect
  useEffect(() => {
    if (ip) {
      const newSocket = io(`http://${ip}:3000`);
      setSocket(newSocket);

      // Cleanup socket connection when component unmounts
      return () => newSocket.close();
    }
  }, [ip]);

  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("upload");
  const [price, setPrice] = useState(0);
  const [fileType, setFileType] = useState({
    name: '',
    pages: '',
    pagePerSheet: 0,
    layout: 'portrait',
    color: 'black',
    flip: false
  });

  const [userInfo, setUserInfo] = useState({
    ipAddress: "",
  });

  // Calculate price based on the fileType values
  const calculatePrice = () => {
    let temp_pages = fileType.pages;

    // If pages are in a range, calculate the range difference
    if (temp_pages.includes('-')) {
      const arr = temp_pages.split('-');
      temp_pages = Number(arr[1]) - Number(arr[0]);
    }

    console.log(temp_pages);

    const price = (Number(temp_pages) / fileType.pagePerSheet) * 1.5;

    if (fileType.flip) {
      return price / 2;
    }

    return price;
  };

  // Memoize the calculated price to avoid recalculating on every render
  const calculatedPrice = useMemo(() => calculatePrice(), [fileType, file]);

  // Handle file selection
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Handle file upload via WebSocket
  const handleUpload = () => {
    if (!file) {
      alert("Please select a file!");
      return;
    }

    setPrice(calculatedPrice);
    setStatus("uploading");

    const reader = new FileReader();

    reader.onload = () => {
      const arrayBuffer = reader.result;
      socket.emit("uploadFile", { 
        fileName: file.name, 
        fileData: arrayBuffer, 
        fileType, 
        userInfo 
      });

      // Listen for successful upload and change status
      socket.on("uploadSuccess", () => {
        setStatus("Done");
      });
    };

    reader.readAsArrayBuffer(file);
  };

  // Handle input changes for fileType
  const handleInputChange = (field, value) => {
    setFileType((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div>
      <div>
        <h1>File Upload App (WebSocket)<span>{status}</span></h1>
      </div>
      <input 
        type="text" 
        placeholder="Enter name" 
        onChange={(e) => handleInputChange("name", e.target.value)} 
      />
      <input 
        type="text" 
        placeholder="Enter pages" 
        onChange={(e) => handleInputChange("pages", e.target.value)} 
      />
      <input 
        type="number" 
        placeholder="Enter pages per sheet" 
        onChange={(e) => handleInputChange("pagePerSheet", e.target.value)} 
      />
      <select
        value={fileType.layout}
        onChange={(e) => handleInputChange("layout", e.target.value)}
      >
        <option value="portrait">Portrait</option>
        <option value="landscape">Landscape</option>
      </select>
      <select
        value={fileType.color}
        onChange={(e) => handleInputChange("color", e.target.value)}
      >
        <option value="color">Color</option>
        <option value="black">Black</option>
      </select>
      <input 
        type="checkbox" 
        checked={fileType.flip} 
        onChange={(e) => handleInputChange("flip", e.target.checked)} 
      />
      <label>Print on Both sides</label>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload File</button>
      <div>
        Price: {calculatedPrice}
      </div>
    </div>
  );
}

export default FileUploadApp;
