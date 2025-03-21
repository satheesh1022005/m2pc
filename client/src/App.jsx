import React, { useEffect, useState } from "react";
import FileUploadApp from "./components/FileUploadApp";
import FileViewPage from "./components/FileViewPage";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import "./App.css"
function App() {
  const [ipAddress, setIpAddress] = useState({
    ip: "",
    status: false,
  });

  useEffect(() => {
    const ip = window.location.hostname;  // Get the hostname (IP address or domain name)
    setIpAddress({ip:ip,status:true});
  }, []);
  console.log(ipAddress);
  return (
    <>
      <Router>
        <Routes>

          {ipAddress.status && (
            <>
          <Route path="/" element={<FileUploadApp ip={ipAddress.ip}/>} />
          <Route path="/admin" element={<FileViewPage ip={ipAddress.ip}/>} />
          </>
          )}
        </Routes>
      </Router>
    </>
  );
}

export default App;
