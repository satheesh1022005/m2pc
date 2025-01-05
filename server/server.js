const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const fs = require("fs");
const path = require("path");

const app = express();
const server = http.createServer(app);
const ip = "0.0.0.0";

// Allow CORS for your frontend (localhost:5173)
app.get("/", (req, res) => {
  res.json({ message: "Hello from the server!" });
});

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

// File metadata storage paths
const metadataFilePath = path.join(__dirname, "file_metadata.json");
const priceDataFilePath = path.join(__dirname, "file_price_data.json");

// Utility function to read file metadata
function readMetadata() {
  if (fs.existsSync(metadataFilePath)) {
    return JSON.parse(fs.readFileSync(metadataFilePath, "utf-8"));
  }
  return [];
}

// Utility function to write file metadata
function writeMetadata(data) {
  fs.writeFileSync(metadataFilePath, JSON.stringify(data, null, 2), "utf-8");
}

// Utility function to read price data
function readPriceData() {
  if (fs.existsSync(priceDataFilePath)) {
    return JSON.parse(fs.readFileSync(priceDataFilePath, "utf-8"));
  }
  return [];
}

// Utility function to write price data
function writePriceData(priceData) {
  const existingData = readPriceData();
  existingData.push(priceData);
  fs.writeFileSync(priceDataFilePath, JSON.stringify(existingData, null, 2), "utf-8");
}

// Utility function to generate a unique file name if a file with the same name already exists
function getUniqueFilePath(fileName) {
  const extname = path.extname(fileName);
  const basename = path.basename(fileName, extname);
  let uniqueFilePath = path.join(uploadDir, fileName);
  let counter = 1;

  while (fs.existsSync(uniqueFilePath)) {
    uniqueFilePath = path.join(uploadDir, `${basename}_${counter}${extname}`);
    counter++;
  }

  return uniqueFilePath;
}

// WebSocket handling
io.on("connection", (socket) => {
  console.log("Client connected");
  io.emit("fileList", readMetadata());
      io.emit("dataList", readPriceData());
  socket.on("uploadFile", (data) => {
    const { fileName, fileData, fileType, userInfo } = data;

    if (!fileName || !fileData || !fileType) {
      socket.emit("uploadStatus", { success: false, message: "Invalid file data!" });
      return;
    }

    const uniqueFileName = getUniqueFilePath(fileName);

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
        fileName,
        uniqueFileName,
        fileType,
        userInfo,
        filePath: uniqueFileName,
        uploadTime: new Date(),
      };
      metadata.push(fileMetadata);
      writeMetadata(metadata);

      // Save price data
      const priceData = {
        price: fileType.price || "Unknown",
        uploadTime: new Date(),
      };
      writePriceData(priceData);

      socket.emit("uploadStatus", { success: true, message: `File uploaded successfully: ${fileName}` });
      io.emit("fileList", metadata);
      io.emit("dataList", readPriceData());

      // Schedule file deletion after 30 seconds
      setTimeout(() => {
        fs.unlink(uniqueFileName, (err) => {
          if (err) {
            console.error("Error deleting file:", err);
            return;
          }
          console.log("File deleted after 30 seconds:", fileName);

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
server.listen(port, ip, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
