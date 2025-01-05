import React, { useState } from "react";
import FileUploadApp from "./components/FileUploadApp";
import FileViewPage from "./components/FileViewPage";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import "./App.css"
function App() {
  const [ip, setIP] = useState({
    ipAddress: '',
    status: false
  });

  return (
    <>
      {!ip.status && <div className="ip-table">
        <h1>Welcome to the Photocopy Shop</h1>
        <div>
        <input
        type="text"
        value={ip.ipAddress}
        placeholder="Enter IP Address"
        onChange={(e) => setIP({ ...ip, ipAddress: e.target.value })}
      />
      <button onClick={() => setIP({ ipAddress: ip.ipAddress, status: true })}>
        Connect
      </button>
        </div>

      </div>}
      {/* {ip.status && (
        <>
          <FileUploadApp ip={ip.ipAddress} />
          <FileViewPage ip={ip.ipAddress} />
        </>
      )} */}
      <Router>
        <Routes>
          
          {ip.status && (
            <>
          <Route path="/" element={<Home/>}/>
          <Route path="/upload" element={<FileUploadApp ip={ip.ipAddress}/>} />
          <Route path="/admin" element={<FileViewPage ip={ip.ipAddress}/>} />
          </>
          )}     
        </Routes>
      </Router>
    </>
  );
}

export default App;
