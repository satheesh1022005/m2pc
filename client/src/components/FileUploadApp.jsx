import React, {useMemo, useEffect, useState } from "react";
import { io } from "socket.io-client";
import "./style.css";
import data from "./printData";
function FileUploadApp({ ip }) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (ip) {
      const newSocket = io(`http://${ip}:3000`);
      setSocket(newSocket);

      return () => newSocket.close();
    }
  }, [ip]);
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("upload");
  const [fileType, setFileType] = useState({
    name: "",
    pages: "",
    pagePerSheet: 0,
    layout: 'portrait',
    color: 'black',
    price: 0,
    flip: false
  });

  const [userInfo, setUserInfo] = useState({ ipAddress: "" });

  const calculatePrice = () => {
    let temp_pages = fileType.pages;

    if (temp_pages.includes('-')) {
      const arr = temp_pages.split('-');
      temp_pages = Number(arr[1]) - Number(arr[0]);
    }

    const price = (Number(temp_pages) / fileType.pagePerSheet) * (fileType.color==='black'?data.price.black:data.price.color);  

    if (fileType.flip) {
      return price / 2;
    }

    return price;
  };

  const calculatedPrice = useMemo(() => calculatePrice(), [fileType, file]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = () => {
    const valuePrice = calculatePrice();
    if (!file) {
      alert("Please select a file!");
      return;
    }

    setFileType((prev) => ({ ...prev, price: valuePrice }));
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
      alert("File uploaded successfully!");
      socket.on("uploadSuccess", () => {
        setStatus("Done");
      });
      setStatus("Done");
    };

    reader.readAsArrayBuffer(file);
  };

  const handleInputChange = (field, value) => {
    setFileType((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="file-upload-container">
    <div className="file-upload-app">
      <div className="header">
        <h1>File Upload</h1>
      </div>
      <div className="input-group">
        <input
          type="text"
          className="input-field"
          placeholder="Enter name"
          onChange={(e) => handleInputChange("name", e.target.value)}
        />
        <input
          type="text"
          className="input-field"
          placeholder="Enter pages"
          onChange={(e) => handleInputChange("pages", e.target.value)}
        />
        <input
          type="number"
          className="input-field"
          placeholder="Enter pages per sheet"
          onChange={(e) => handleInputChange("pagePerSheet", e.target.value)}
        />
      </div>
      <div className="select-group">
        <select
          className="select-field"
          value={fileType.layout}
          onChange={(e) => handleInputChange("layout", e.target.value)}
        >
          <option value="portrait">Portrait</option>
          <option value="landscape">Landscape</option>
        </select>
        <select
          className="select-field"
          value={fileType.color}
          onChange={(e) => handleInputChange("color", e.target.value)}
        >
          <option value="color">Color</option>
          <option value="black">Black</option>
        </select>
      </div>
      <div className="checkbox-group">
        <input
          type="checkbox"
          className="checkbox-field"
          checked={fileType.flip}
          onChange={(e) => handleInputChange("flip", e.target.checked)}
        />
        <label>Print on Both sides</label>
      </div>
      <input type="file" className="file-input" onChange={handleFileChange} />
      <button className="upload-button" onClick={handleUpload}>Upload File</button>
      <div className="price">
        Price: {fileType.price.toFixed(2)}
      </div>
    </div>
    </div>  
  );
}

export default FileUploadApp;
