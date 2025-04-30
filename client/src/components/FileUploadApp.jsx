import React, { useState, useEffect, useMemo } from "react";
import { io } from "socket.io-client";
import "./style.css";
import axios from "axios";

function FileUploadApp({ ip }) {
  const [socket, setSocket] = useState(null);
  const [price, setPrice] = useState({
    blackPrice: 1,
    colorPrice: 5,
  });
  const [userInfo, setUserInfo] = useState({ ipAddress: "" });
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("upload");
  const [fileType, setFileType] = useState({
    name: "",
    pages: "",
    pagePerSheet: 1,
    layout: "portrait",
    color: "black",
    price: 0,
    flip: false,
  });
  useEffect(() => {
    if (ip) {
      const newSocket = io(`http://${ip}:3000`);
      setSocket(newSocket);

      return () => newSocket.close();
    }
  }, [ip]);
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const response = await axios.get(`http://${ip}:3000/pricing`);
        setPrice({
          blackPrice: response.data.blackPrice,
          colorPrice: response.data.colorPrice,
        });
      } catch (error) {
        console.log(error);
      }
    };
    if (ip) {
      fetchPricing();
    }
  }, []);

  const calculatePrice = () => {
    let temp_pages = fileType.pages;
    let numPages = 1;

    if (temp_pages.includes("-")) {
      const arr = temp_pages.split("-");
      console.log(arr);
      numPages = Number(arr[1]) - Number(arr[0]) + 1;
    } else if (!isNaN(Number(temp_pages)) && temp_pages.trim() !== "") {
      numPages = Number(temp_pages);
    }
    console.log(price);
    console.log(numPages);
    const copyPrice =
      (numPages / fileType.pagePerSheet) *
      (fileType.color === "black" ? price.blackPrice || 1 : price.colorPrice || 5);
    console.log("copyPrice"+copyPrice);
    if (fileType.flip) {
      return Math.round(copyPrice) + copyPrice - copyPrice / 2;
    }
    if (!isFinite(copyPrice)) {
      return 1;
    }
    return copyPrice;
  };


  const calculatedPrice = useMemo(() => calculatePrice(), [fileType, file]);
  console.log(calculatedPrice);
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = () => {
    const valuePrice = calculatePrice();
    if (!file) {
      alert("Please select a file!");
      return;
    }

    setFileType((prev) => ({ ...prev, price: valuePrice + fileType.price }));
    setStatus("uploading");

    const reader = new FileReader();

    reader.onload = () => {
      const arrayBuffer = reader.result;
      socket.emit("uploadFile", {
        fileName: file.name,
        fileData: arrayBuffer,
        fileType,
        userInfo,
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
        <div className="radio-group">
          <label>Layout:</label>
          <div className="radio-options">
            {" "}
            <label>
              <input
                type="radio"
                name="layout"
                value="portrait"
                checked={fileType.layout === "portrait"}
                onChange={(e) => handleInputChange("layout", e.target.value)}
              />
              Portrait
            </label>
            <label>
              <input
                type="radio"
                name="layout"
                value="landscape"
                checked={fileType.layout === "landscape"}
                onChange={(e) => handleInputChange("layout", e.target.value)}
              />
              Landscape
            </label>
          </div>
        </div>
        <div className="radio-group">
          <label>Color:</label>
          <div className="radio-options">
            <label>
              <input
                type="radio"
                name="color"
                value="black"
                checked={fileType.color === "black"}
                onChange={(e) => handleInputChange("color", e.target.value)}
              />
              Black
            </label>
            <label>
              <input
                type="radio"
                name="color"
                value="color"
                checked={fileType.color === "color"}
                onChange={(e) => handleInputChange("color", e.target.value)}
              />
              Color
            </label>
          </div>
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
        <button className="upload-button" onClick={handleUpload}>
          Upload File
        </button>
        <div className="price">Price: {calculatedPrice}</div>
      </div>
    </div>
  );
}

export default FileUploadApp;
