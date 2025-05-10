import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import FileUploadApp from "./components/FileUploadApp";
import FileViewPage from "./components/FileViewPage";
import "./App.css";

function App() {
  const [ipAddress, setIpAddress] = useState({
    ip: "",
    status: false,
  });
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchFiles = async () => {
    if (!ipAddress.ip) return;

    try {
      const res = await axios.get(`http://${ipAddress.ip}:3000/files`);
      if (JSON.stringify(res.data) !== JSON.stringify(files)) {
        console.log("Files updated:", res.data);
        setFiles(res.data);
      }
    } catch (err) {
      console.error("Error fetching files:", err);
      setError("Failed to fetch files");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const ip = window.location.hostname;
    setIpAddress({ ip: ip, status: true });
  }, []);

  useEffect(() => {
    let interval;
    if (ipAddress.status) {
      fetchFiles();
      interval = setInterval(fetchFiles, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [ipAddress.status]);

  return (
    <Router>
      <Routes>
        {ipAddress.status && (
          <>
            <Route
              path="/"
              element={
                <FileUploadApp
                  ip={ipAddress.ip}
                  onUpload={fetchFiles}
                />
              }
            />
            <Route
              path="/admin/*"
              element={
                <FileViewPage
                  ip={ipAddress.ip}
                  files={files}
                  setFiles={setFiles}
                  onUpload={fetchFiles}
                  loading={loading}
                />
              }
            />
            <Route path="*" element={<Navigate to="/" />} />
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;
