import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import GetIpAddress from './GetIpAddress';

const FileViewPage = ({ ip }) => {
  const [files, setFiles] = useState([]); // State to hold file metadata
  const [error, setError] = useState(null); // State to hold error messages

  useEffect(() => {
    if (!ip) {
      return;
    }

    // Connect to the WebSocket server
    const socket = io(`http://${ip}:3000`); // Replace with your server URL
    
    // Listen for the 'fileList' event to get file metadata
    socket.on('fileList', (fileMetadata) => {
      console.log('Received file metadata:', fileMetadata);
      setFiles(fileMetadata); // Update state with received metadata
    });

    // Error handling for WebSocket connection
    socket.on('connect_error', (err) => {
      console.error('WebSocket error:', err);
      setError('Error connecting to the server');
    });

    // Clean up the WebSocket connection when the component is unmounted
    return () => {
      socket.disconnect();
    };
  }, [ip]);

  // Reverse the array to show the latest file first
  const reversedFiles = [...files].reverse();

  // Handle the print functionality for a selected file
  const handlePrint = (file) => {
    // Here, you can add logic to prepare the data for printing
    console.log('Printing file:', file);
    window.print(); // Opens the print dialog
  };

  return (
    <div>
      <h1>File List</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {reversedFiles.length === 0 ? (
        <p>No files found</p>
      ) : (
        <table border="1" cellPadding="10">
          <thead>
            <tr>
              <th>Name</th>
              <th>File Name</th>
              <th>Pages</th>
              <th>Layout</th>
              <th>Color</th>
              <th>Pages Per Sheet</th>
              <th>Uploaded Time</th>
              <th>Print</th>
            </tr>
          </thead>
          <tbody>
            {reversedFiles.map((file, index) => (
              <tr key={index}>
                <td>{file.fileType.name}</td>
                <td>{file.fileName}</td>
                <td>{file.fileType.pages}</td>
                <td>{file.fileType.layout}</td>
                <td>{file.fileType.color}</td>
                <td>{file.fileType.pagePerSheet}</td>
                <td>{new Date(file.uploadTime).toLocaleString()}</td>
                <td><button onClick={() => handlePrint(file)}>Print</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default FileViewPage;
