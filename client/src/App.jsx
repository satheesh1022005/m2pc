import React, { useState } from "react";
import FileUploadApp from "./components/FileUploadApp";
import FileViewPage from "./components/FileViewPage";

function App() {
  const [ip, setIP] = useState({
    ipAddress: '',
    status: false
  });

  return (
    <>
      <input
        type="text"
        value={ip.ipAddress}
        onChange={(e) => setIP({ ...ip, ipAddress: e.target.value })}
      />
      <button onClick={() => setIP({ ipAddress: ip.ipAddress, status: true })}>
        Connect
      </button>
      <h1>hello</h1>
      {ip.status && (
        <>
          <FileUploadApp ip={ip.ipAddress} />
          <FileViewPage ip={ip.ipAddress} />
        </>
      )}
    </>
  );
}

export default App;
