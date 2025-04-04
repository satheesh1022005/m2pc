import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import Swal from "sweetalert2"; // Import SweetAlert2
import PriceCalculator from "./PriceCalculator";
import "./style.css";
import NavBar from "./Navbar";
import SettingsPage from "./SettingsPage";

const FileViewPage = ({ ip }) => {
  const [files, setFiles] = useState([]);
  const [price, setPrice] = useState([]);
  const [error, setError] = useState(null);
  const [toggle, setToggle] = useState(false);
  const [validUser, setValidUser] = useState(false);
  const [navbarData, setNavbarData] = useState("dashboard");
  const navigate = useNavigate();

  useEffect(() => {
    if (!validUser) {
      Swal.fire({
        title: "Admin Login",
        text: "Enter the admin password to continue:",
        input: "password",
        inputAttributes: {
          autocapitalize: "off",
        },
        showCancelButton: false,
        confirmButtonText: "Submit",
        allowOutsideClick: false,
        allowEscapeKey: false,
        preConfirm: (password) => {
          if (password !== "admin") {
            Swal.fire({
              icon: "error",
              title: "Access Denied",
              text: "Incorrect password. Redirecting...",
            }).then(() => {
              window.location.href = "/";
            });
          } else {
            setValidUser(true);
          }
        },
      });
    }

    if (!ip) {
      console.warn("IP address not provided");
      setError("Server IP not provided");
      return;
    }

    const socket = io(`http://${ip}:3000`);

    socket.on("fileList", (fileMetadata) => {
      console.log("Received file metadata:", fileMetadata);
      setFiles(fileMetadata);
    });

    socket.on("dataList", (dataList) => {
      console.log("Received data list:", dataList);
      setPrice(dataList);
    });

    socket.on("connect_error", (err) => {
      console.error("WebSocket error:", err);
      Swal.fire({
        icon: "error",
        title: "Connection Error",
        text: "Error connecting to the server. Please check your connection.",
      });
      setError("Error connecting to the server");
    });

    return () => {
      socket.off("fileList");
      socket.off("dataList");
      socket.disconnect();
    };
  }, [ip]);

  const handlePrint = (file) => {
    Swal.fire({
      title: "Print Confirmation",
      text: `Are you sure you want to print the file "${file.fileName}"?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Print",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        window.print();
        Swal.fire({
          icon: "success",
          title: "Print Started",
          text: `The file "${file.fileName}" is being printed.`,
        });
      }
    });
  };

  let totalRevenue = 0;
  if (price?.length > 0) {
    for (let i = 0; i < price.length; i++) {
      if (price[i].price !== "Unknown") totalRevenue += Number(price[i].price);
      console.log(price[i].price);
    }
  }

  console.log(navbarData);

  return (
    <>
      <NavBar setNavbarData={setNavbarData} />
      {validUser &&
        (navbarData === "dashboard" ? (
          <>
            <div className="container">
              <h1>List of Files to be Printed</h1>
              {files.length === 0 ? (
                <p>No files found</p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>File Name</th>
                      <th>Pages</th>
                      <th>Layout</th>
                      <th>Color</th>
                      <th>Pages Per Sheet</th>
                      <th>Price</th>
                      <th>Uploaded Time</th>
                      <th>Print</th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map((file, index) => (
                      <tr key={file.uniqueFileName || index}>
                        <td>{file?.fileType?.name || "N/A"}</td>
                        <td>{file.fileName}</td>
                        <td>{file?.fileType?.pages || "N/A"}</td>
                        <td>{file?.fileType?.layout || "N/A"}</td>
                        <td>{file?.fileType?.color || "N/A"}</td>
                        <td>{file?.fileType?.pagePerSheet || "N/A"}</td>
                        <td>
                          {file?.fileType?.price === "Unknown"
                            ? "1.5"
                            : file?.fileType?.price.toFixed(2) || "0"}
                        </td>
                        <td>{new Date(file.uploadTime).toLocaleString()}</td>
                        <td>
                          <button onClick={() => handlePrint(file)}>
                            Print
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div className="total-revenue">
                Total Revenue: <span>{totalRevenue.toFixed(2)}</span>
              </div>
              <div onClick={() => setToggle(!toggle)} className="toggle-button">
                View Revenue at range
              </div>
              {toggle && (
                <div className="price-calculator">
                  <PriceCalculator data={price} />
                </div>
              )}
            </div>
          </>
        ) : navbarData === "revenue" ? (
          <>
            <PriceCalculator data={price} />
          </>
        ) : (
          <SettingsPage ip={ip} />
        ))}
    </>
  );
};

export default FileViewPage;
