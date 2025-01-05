
import React, { useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000"); // Connect to WebSocket server

function FileUploadApp() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('upload');
  const [price, setPrice] = useState(0);
  const [fileType, setFileType] = useState({
    name: '',
    pages: '',
    pagePerSheet: 0,
    layout: 'portrait',
    color: 'black',
    flip:false
  })
  const calculatePrice = () => {
    let temp_pages = fileType.pages;
  
    // Check if the pages are in a range like "10-20"
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
  
  const [userInfo, setUserInfo] = useState({
    ipAddress: "",
  })
  console.log(fileType)
  // Handle file selection
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Handle file upload via WebSocket
  const handleUpload = () => {
    console.log(file)
    if (!file) {
      alert("Please select a file!");
      return;
    }
    setPrice(calculatePrice())
    setStatus('uploading');
    const reader = new FileReader();

    // Convert file to binary string to send over WebSocket
    reader.onload = () => {
      const arrayBuffer = reader.result;
      socket.emit("uploadFile", { fileName: file.name, fileData: arrayBuffer, fileType, userInfo });
      setStatus('Done')
    };

    reader.readAsArrayBuffer(file); // Read file as ArrayBuffer
  };

  return (
    <div>
      <div>
        <h1>File Upload App (WebSocket)<span>{status}</span></h1>

      </div>
      <input type="text" placeholder="Enter name" onChange={(e) => setFileType({ ...fileType, name: e.target.value })}/>
      <input type="text" placeholder="Enter pages" onChange={(e) => setFileType({ ...fileType, pages: e.target.value })} />
      <input type="number" placeholder="Enter pages per sheet" onChange={(e) => setFileType({ ...fileType, pagePerSheet: e.target.value })} />
      <select
        value={fileType.layout}
        onChange={(e) => setFileType({ ...fileType, layout: e.target.value })}
      >
        <option value="portrait">Portrait</option>
        <option value="landscape">Landscape</option>
      </select>
      <select
        value={fileType.color}
        onChange={(e) => setFileType({ ...fileType, color: e.target.value })}
      >
        <option value="color">color</option>
        <option value="black">black</option>
      </select>
      <input type="checkbox" checked={fileType.flip} onChange={(e) => setFileType({ ...fileType, flip: e.target.checked })} />
      <label>Print on Both side</label>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload File</button>
      <div>
        Price:{price}
      </div>
    </div>
  );
}

export default FileUploadApp;