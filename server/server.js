const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const fs = require("fs");
const path = require("path");

const app = express();
const server = http.createServer(app);
app.get("/", (req, res) => {
  res.send("Hello World!");
});
// Allow CORS for your frontend (localhost:5173)
const io = socketIo(server, {
  cors: {
    origin: "*", // Replace with your frontend's URL
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  },
});

const port = 3000;
const uploadDir = path.join(__dirname, "uploads");

// Ensure the upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// File metadata storage (will be saved as a JSON file)
const metadataFilePath = path.join(__dirname, "file_metadata.json");

// Utility function to read the file metadata
function readMetadata() {
  if (fs.existsSync(metadataFilePath)) {
    const data = fs.readFileSync(metadataFilePath, "utf-8");
    return JSON.parse(data); // Parse JSON data from the file
  }
  return []; // Return an empty array if the file doesn't exist
}

// Utility function to write file metadata
function writeMetadata(data) {
  fs.writeFileSync(metadataFilePath, JSON.stringify(data, null, 2), "utf-8");
}

// Utility function to generate a unique file name if a file with the same name already exists
function getUniqueFilePath(fileName) {
  const filePath = path.join(uploadDir, fileName);
  let uniqueFilePath = filePath;
  let counter = 1;

  // Generate a unique file name (a1, a2, a3, ...) if the file exists
  while (fs.existsSync(uniqueFilePath)) {
    const extname = path.extname(fileName);
    const basename = path.basename(fileName, extname);
    uniqueFilePath = path.join(uploadDir, `${basename}${counter}${extname}`);
    counter++;
  }

  return uniqueFilePath;
}
io.on("connection", (socket) => {
  console.log("Client connected");

  socket.on("uploadFile", (data) => {
    const { fileName, fileData, fileType, userInfo } = data;
    console.log("File data received:", fileName);

    // Generate a unique file path
    const uniqueFileName = getUniqueFilePath(fileName);
    const originalFileName = fileName;

    // Save the file
    fs.writeFile(uniqueFileName, Buffer.from(fileData), (err) => {
      if (err) {
        console.error("Error saving file:", err);
        socket.emit("uploadStatus", {
          success: false,
          message: "File upload failed!",
        });
        return;
      }

      console.log("File uploaded successfully:", fileName);

      // Update and save metadata
      const metadata = readMetadata();
      const fileMetadata = {
        fileName: originalFileName,
        uniqueFileName,
        fileType,
        userInfo,
        filePath: uniqueFileName,
        uploadTime: new Date(),
      };
      metadata.push(fileMetadata);
      writeMetadata(metadata);

      socket.emit("uploadStatus", {
        success: true,
        message: `File uploaded successfully: ${fileName}`,
      });
      io.emit("fileList", metadata);

      // Schedule file deletion after 30 seconds
      setTimeout(() => {
        // Delete the file
        fs.unlink(uniqueFileName, (err) => {
          if (err) {
            console.error("Error deleting file:", err);
            return;
          }
          console.log("File deleted after 30 seconds:", originalFileName);

          // Update metadata
          const updatedMetadata = readMetadata().filter(
            (item) => item.uniqueFileName !== uniqueFileName
          );
          writeMetadata(updatedMetadata);
          io.emit("fileList", updatedMetadata);
        });
      }, 30000); // 30 seconds
    });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// Start the server
server.listen(port, () => {
  console.log(`Server is running at http:"0.0.0.0":${port}`);
});
