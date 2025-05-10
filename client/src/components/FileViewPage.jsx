import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import NavBar from "../pages/Navbar";
import History from "../pages/History";
import SalesChart from "../pages/SalesChart";
import FileTypePieChart from "../pages/FileTypePieChart";
import PriceCalculator from "../pages/PriceCalculator";
import SettingsPage from "../pages/SettingsPage";

const FileViewPage = ({ ip, files, setFiles, onUpload, loading }) => {
  const [validUser, setValidUser] = useState(false);
  const [navbarData, setNavbarData] = useState("dashboard");

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
  }, []);

  const renderFileList = () => {
    if (loading) {
      return <div>Loading files...</div>;
    }

    if (!files || files.length === 0) {
      return <div>No files available</div>;
    }

    return (
      <div className="file-list">
        <h1>List of Files to be Printed</h1>
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
                <td>{file?.userInfo?.name || "N/A"}</td>
                <td>{file.originalFileName}</td>
                <td>{file?.config?.pages || "N/A"}</td>
                <td>{file?.config?.layout || "N/A"}</td>
                <td>{file?.config?.color || "N/A"}</td>
                <td>{file?.config?.pagePerSheet || "N/A"}</td>
                <td>
                  {file?.config?.price === "Unknown"
                    ? "1.5"
                    : file?.config?.price || "0"}
                </td>
                <td>{new Date(file.uploadTime).toLocaleString()}</td>
                <td>
                  <button onClick={() => handlePrint(file)}>Print</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const handlePrint = (file) => {
    Swal.fire({
      title: "Print Confirmation",
      text: `Are you sure you want to print the file "${file.originalFileName}"?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Print",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        const fileURL = `http://${ip}:3000/${file.uniqueFileName}`;

        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Print</title>
              </head>
              <body style="margin:0">
                <iframe src="${fileURL}" style="border:none; width:100%; height:100vh;" onload="this.contentWindow.focus(); this.contentWindow.print();"></iframe>
              </body>
            </html>
          `);
          printWindow.document.close();
        } else {
          console.error("Failed to open print window");
        }

        Swal.fire({
          icon: "success",
          title: "Print Started",
          text: `The file "${file.fileName}" is being printed.`,
        });
      }
    });
  };

  const renderContent = () => {
    switch (navbarData) {
      case "dashboard":
        return renderFileList();
      case "history":
        return <History />;
      case "sales":
        return (
          <div>
            <SalesChart />
            <FileTypePieChart />
          </div>
        );
      case "revenue":
        return <PriceCalculator data={files} />;
      case "settings":
        return <SettingsPage ip={ip} />;
      default:
        return renderFileList();
    }
  };

  return (
    <div>
      <NavBar setNavbarData={setNavbarData} />
      {validUser && renderContent()}
    </div>
  );
};

export default FileViewPage;
