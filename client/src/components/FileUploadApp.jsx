import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";

function FileUploadApp({ ip, onUpload }) {
  const [price, setPrice] = useState({ blackPrice: 1, colorPrice: 5 });
  const [userInfo, setUserInfo] = useState({ ipAddress: "", name: "" });
  const [files, setFiles] = useState([]);
  const [showConfigPopup, setShowConfigPopup] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("idle");
  const [currentFileConfig, setCurrentFileConfig] = useState({
    pages: "",
    pagePerSheet: 1,
    layout: "portrait",
    color: "black",
    price: 0,
    flip: false,
  });

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
    if (ip) fetchPricing();
  }, [ip]);

  const calculatePrice = (config) => {
    let temp_pages = config.pages;
    let numPages = 1;

    if (temp_pages.includes("-")) {
      const arr = temp_pages.split("-");
      numPages = Number(arr[1]) - Number(arr[0]) + 1;
    } else if (!isNaN(Number(temp_pages)) && temp_pages.trim() !== "") {
      numPages = Number(temp_pages);
    }

    const copyPrice =
      (numPages / config.pagePerSheet) *
      (config.color === "black" ? price.blackPrice || 1 : price.colorPrice || 5);

    if (config.flip) return Math.round(copyPrice) + copyPrice - copyPrice / 2;
    if (!isFinite(copyPrice)) return 1;
    return copyPrice;
  };

  const calculatedPrice = useMemo(
    () => calculatePrice(currentFileConfig),
    [currentFileConfig, price]
  );

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setCurrentFile(e.target.files[0]);
      setShowConfigPopup(true);
    }
  };

  const handleConfigChange = (field, value) => {
    setCurrentFileConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddFileWithConfig = () => {
    if (!currentFile) {
      alert("No file selected!");
      return;
    }
    const fileWithConfig = {
      file: currentFile,
      config: {
        ...currentFileConfig,
        price: calculatePrice(currentFileConfig),
        fileName: currentFile.name,
      },
    };
    setFiles((prev) => [...prev, fileWithConfig]);
    setCurrentFile(null);
    setCurrentFileConfig({
      pages: "",
      pagePerSheet: 1,
      layout: "portrait",
      color: "black",
      price: 0,
      flip: false,
    });
    setShowConfigPopup(false);
  };

  const handleRemoveFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (fileWithConfig) => {
    const formData = new FormData();
    formData.append("file", fileWithConfig.file);
    formData.append("config", JSON.stringify(fileWithConfig.config));
    formData.append("userInfo", JSON.stringify(userInfo));

    return await axios.post(`http://${ip}:3000/upload-file`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  };

  const handleUploadAll = async () => {
    setUploadStatus("uploading");
    try {
      const uploadedFiles = [];
      for (const fileWithConfig of files) {
        const result = await uploadFile(fileWithConfig);
        uploadedFiles.push(result.data);
      }

      // Update files state directly after successful upload
      setFiles([]); // Clear local files
      onUpload(); // Fetch updated files

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "All files uploaded successfully!",
      });
    } catch (error) {
      console.error("Upload error:", error);
      Swal.fire({
        icon: "error",
        title: "Upload Error",
        text: "Failed to upload some files.",
      });
    } finally {
      setUploadStatus("idle");
    }
  };

  const getTotalPrice = () =>
    files.reduce((total, fileWithConfig) => total + fileWithConfig.config.price, 0);

  return (
    <div className="file-upload-container">
      <div className="file-upload-app">
        <div className="header">
          <h1>Multi-File Upload</h1>
          <input
            type="text"
            className="input-field"
            placeholder="Enter your name"
            value={userInfo.name}
            onChange={(e) =>
              setUserInfo({ ...userInfo, name: e.target.value })
            }
          />
        </div>

        <div className="upload-section">
          <input
            type="file"
            className="file-input"
            onChange={handleFileChange}
          />
          <div className="file-list">
            <h3>Files to upload ({files.length})</h3>
            {files.length > 0 ? (
              <ul className="file-items">
                {files.map((fileWithConfig, index) => (
                  <li key={index} className="file-item">
                    <div className="file-info">
                      <span className="file-name">
                        {fileWithConfig.file.name}
                      </span>
                      <span className="file-config">
                        {fileWithConfig.config.color} |{" "}
                        {fileWithConfig.config.layout} |{" "}
                        {fileWithConfig.config.flip
                          ? "Double-sided"
                          : "Single-sided"}{" "}
                        | ${fileWithConfig.config.price.toFixed(2)}
                      </span>
                    </div>
                    <button
                      className="remove-button"
                      onClick={() => handleRemoveFile(index)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-files">No files added yet</p>
            )}
          </div>

          {files.length > 0 && (
            <div className="upload-summary">
              <div className="total-price">
                Total Price: ${getTotalPrice().toFixed(2)}
              </div>
              <button
                className="upload-all-button"
                onClick={handleUploadAll}
                disabled={uploadStatus === "uploading"}
              >
                {uploadStatus === "uploading"
                  ? "Uploading..."
                  : "Upload All Files"}
              </button>
            </div>
          )}
        </div>

        {showConfigPopup && (
          <div className="config-popup-overlay">
            <div className="config-popup">
              <h3>Configure File: {currentFile?.name}</h3>
              <section className="file-config-form">
                <div className="input-group">
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Enter pages (e.g., 1-5 or 3)"
                    value={currentFileConfig.pages}
                    onChange={(e) =>
                      handleConfigChange("pages", e.target.value)
                    }
                  />
                  <input
                    type="number"
                    className="input-field"
                    placeholder="Pages per sheet"
                    value={currentFileConfig.pagePerSheet}
                    onChange={(e) =>
                      handleConfigChange(
                        "pagePerSheet",
                        Number(e.target.value)
                      )
                    }
                  />
                </div>

                <div className="radio-group">
                  <label>Layout:</label>
                  <div className="radio-options">
                    <label>
                      <input
                        type="radio"
                        name="layout"
                        value="portrait"
                        checked={currentFileConfig.layout === "portrait"}
                        onChange={(e) =>
                          handleConfigChange("layout", e.target.value)
                        }
                      />
                      Portrait
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="layout"
                        value="landscape"
                        checked={currentFileConfig.layout === "landscape"}
                        onChange={(e) =>
                          handleConfigChange("layout", e.target.value)
                        }
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
                        checked={currentFileConfig.color === "black"}
                        onChange={(e) =>
                          handleConfigChange("color", e.target.value)
                        }
                      />
                      Black
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="color"
                        value="color"
                        checked={currentFileConfig.color === "color"}
                        onChange={(e) =>
                          handleConfigChange("color", e.target.value)
                        }
                      />
                      Color
                    </label>
                  </div>
                </div>

                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    className="checkbox-field"
                    checked={currentFileConfig.flip}
                    onChange={(e) =>
                      handleConfigChange("flip", e.target.checked)
                    }
                  />
                  <label>Print on Both sides</label>
                </div>

                <div className="price">
                  Price: ${calculatedPrice.toFixed(2)}
                </div>

                <div className="config-buttons">
                  <button
                    className="cancel-button"
                    onClick={() => {
                      setShowConfigPopup(false);
                      setCurrentFile(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="add-button"
                    onClick={handleAddFileWithConfig}
                  >
                    Add to List
                  </button>
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FileUploadApp;
