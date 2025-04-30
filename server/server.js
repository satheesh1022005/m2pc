const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");
const app = express();
const cors = require("cors");
const cron = require("node-cron");
const { PDFDocument } = require('pdf-lib');
const db = require("./db");
const server = http.createServer(app);
const ip = "0.0.0.0";
const metadataFilePath = path.join(__dirname, "file_metadata.json");
const priceDataFilePath = path.join(__dirname, "file_price_data.json");
const shopDataFilePath = path.join(__dirname, "shop_data.json");

// Allow CORS for your frontend (localhost:5173)
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.get("/", (req, res) => {
  res.json({ message: "Hello from the server!" });
});

app.get("/pricing", (req, res) => {
  try {
    const data = fs.readFileSync(shopDataFilePath, "utf-8");
    const pricing = JSON.parse(data);
    res.status(200).json(pricing);
  } catch (error) {
    console.error("Error reading shop data:", error);
    res.status(500).json({ error: "Failed to read pricing data" });
  }
});
app.post("/update-pricing", (req, res) => {
  let { blackPrice, colorPrice } = req.body;
  console.log(req.body);
  blackPrice = parseInt(blackPrice);
  colorPrice = parseInt(colorPrice);
  if (typeof blackPrice !== "number" || typeof colorPrice !== "number") {
    return res.status(400).json({ error: "Invalid data format" });
  }
  console.log(blackPrice, colorPrice);
  try {
    // Read the current data
    const data = fs.readFileSync(shopDataFilePath, "utf-8");
    const shopData = JSON.parse(data);

    // Update the pricing
    shopData.blackPrice = blackPrice;
    shopData.colorPrice = colorPrice;

    // Write the updated data back to the file
    console.log(shopData);
    fs.writeFileSync(
      shopDataFilePath,
      JSON.stringify(shopData, null, 2),
      "utf-8"
    );

    res.status(200).json({ message: "Pricing updated successfully" });
  } catch (error) {
    console.error("Error updating shop data:", error);
    res.status(500).json({ error: "Failed to update pricing data" });
  }
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
  fs.writeFileSync(
    priceDataFilePath,
    JSON.stringify(existingData, null, 2),
    "utf-8"
  );
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
      socket.emit("uploadStatus", {
        success: false,
        message: "Invalid file data!",
      });
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
        price: fileType.price || 1,
        uploadTime: new Date(),
      };
      writePriceData(priceData);
      (async () => {
        try {
          await db.query(
            `INSERT INTO uploaded_files (
              file_name, unique_file_name, file_path, upload_time,
              file_type_name, file_type_pages, file_type_page_per_sheet,
              file_type_layout, file_type_color, file_type_price, file_type_flip,
              user_ip_address
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              fileMetadata.fileName,
              fileMetadata.uniqueFileName,
              fileMetadata.filePath,
              new Date(fileMetadata.uploadTime), // ensure it's a valid Date
              fileType.name || null,
              fileType.pages || null,
              fileType.pagePerSheet || null,
              fileType.layout || null,
              fileType.color || null,
              fileType.price || 0,
              fileType.flip ? 1 : 0,
              userInfo?.ipAddress || null
            ]
          );
          console.log("Inserted file metadata into MySQL successfully");
        } catch (err) {
          console.error("Error inserting file metadata into MySQL:", err);
        }
      })();
      socket.emit("uploadStatus", {
        success: true,
        message: `File uploaded successfully: ${fileName}`,
      });
      io.emit("fileList", metadata);
      io.emit("dataList", readPriceData());

      // Schedule file deletion after 30 seconds

    });
  });
  cron.schedule("*/30 * * * * *", () => {
    console.log("Running cleanup task...");

    const metadata = readMetadata();
    const updatedMetadata = [];

    metadata.forEach((file) => {
      const fileAge = (Date.now() - new Date(file.uploadTime).getTime()) / 1000;

      if (fileAge > 30) {
        try {
          fs.unlinkSync(file.uniqueFileName);
          console.log(`Deleted file: ${file.uniqueFileName}`);
        } catch (err) {
          console.error(`Error deleting file ${file.uniqueFileName}:`, err);
        }
      } else {
        updatedMetadata.push(file);
      }
    });

    // Save updated metadata (only files not deleted)
    writeMetadata(updatedMetadata);
    io.emit("fileList", updatedMetadata);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// Start the server
server.listen(port, ip, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
