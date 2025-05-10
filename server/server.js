const express = require("express");
const http = require("http");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const cors = require("cors");
const cron = require("node-cron");
const { PDFDocument } = require('pdf-lib');
const db = require("./db");

const app = express();
const server = http.createServer(app);

const ip = "0.0.0.0";
const port = 3000;

const uploadDir = path.join(__dirname, "uploads");
const metadataFilePath = path.join(__dirname, "file_metadata.json");
const priceDataFilePath = path.join(__dirname, "file_price_data.json");
const shopDataFilePath = path.join(__dirname, "shop_data.json");

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadDir));
// Setup storage for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads"); // make sure uploads folder exists
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

/* ---------- Utility Functions ---------- */

function readMetadata() {
  if (fs.existsSync(metadataFilePath)) {
    const content = fs.readFileSync(metadataFilePath, "utf-8");
    return content.trim() !== "" ? JSON.parse(content) : [];
  }
  return [];
}

function writeMetadata(data) {
  fs.writeFileSync(metadataFilePath, JSON.stringify(data, null, 2), "utf-8");
}

function readPriceData() {
  if (fs.existsSync(priceDataFilePath)) {
    const content = fs.readFileSync(priceDataFilePath, "utf-8");
    return content.trim() !== "" ? JSON.parse(content) : [];
  }
  return [];
}

function writePriceData(priceData) {
  const existingData = readPriceData();
  existingData.push(priceData);
  fs.writeFileSync(priceDataFilePath, JSON.stringify(existingData, null, 2), "utf-8");
}

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

/* ---------- API Endpoints ---------- */

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Server running fine!" });
});

app.post("/upload-file", upload.single("file"), (req, res) => {
  const config = JSON.parse(req.body.config);
  const userInfo = JSON.parse(req.body.userInfo);

  const filePath = req.file.path;

  const metadata = readMetadata();

  const fileEntry = {
    originalFileName: req.file.originalname,
    uniqueFileName: filePath, // full path or relative path, up to you
    uploadTime: new Date().toISOString(),
    userInfo,
    config
  };

  metadata.push(fileEntry);
  writeMetadata(metadata);

  // console.log("Received file:", req.file);
  // console.log("Received config:", config);
  // console.log("Received userInfo:", userInfo);

  res.status(200).json({ message: "File uploaded successfully!" });
});

// Get metadata list
app.get("/files", (req, res) => {
  const metadata = readMetadata();
  res.json(metadata);
});

// Get price data list
app.get("/price-data", (req, res) => {
  const priceData = readPriceData();
  res.json(priceData);
});

// Get sales summary by day
app.get("/sales-per-day", async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT DATE(upload_time) AS date, SUM(file_type_price) AS total_sales
      FROM uploaded_files
      GROUP BY DATE(upload_time)
      ORDER BY DATE(upload_time)
    `);
    res.json(results);
  } catch (err) {
    console.error("Error fetching sales:", err);
    res.status(500).json({ error: "Failed to fetch sales data" });
  }
});

// Get sales by file type color
app.get("/sales-by-filetype-color", async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT file_type_color, SUM(file_type_price) AS total_sales
      FROM uploaded_files
      GROUP BY file_type_color
    `);
    res.json(results);
  } catch (err) {
    console.error("Error fetching sales by color:", err);
    res.status(500).json({ error: "Failed to fetch sales data" });
  }
});

// Get pricing config
app.get("/pricing", (req, res) => {
  try {
    const data = fs.readFileSync(shopDataFilePath, "utf-8");
    res.json(JSON.parse(data));
  } catch (error) {
    console.error("Error reading shop data:", error);
    res.status(500).json({ error: "Failed to read pricing data" });
  }
});
app.get("/history", async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT * FROM uploaded_files
      ORDER BY upload_time DESC
    `);
    res.json(results);
  } catch (err) {
    console.error("Error fetching history:", err);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});
// Update pricing config
app.post("/update-pricing", (req, res) => {
  let { blackPrice, colorPrice } = req.body;
  blackPrice = parseInt(blackPrice);
  colorPrice = parseInt(colorPrice);

  if (typeof blackPrice !== "number" || typeof colorPrice !== "number") {
    return res.status(400).json({ error: "Invalid data format" });
  }

  try {
    const data = fs.readFileSync(shopDataFilePath, "utf-8");
    const shopData = JSON.parse(data);
    shopData.blackPrice = blackPrice;
    shopData.colorPrice = colorPrice;
    fs.writeFileSync(shopDataFilePath, JSON.stringify(shopData, null, 2), "utf-8");
    res.json({ message: "Pricing updated successfully" });
  } catch (err) {
    console.error("Error updating pricing:", err);
    res.status(500).json({ error: "Failed to update pricing data" });
  }
});

/* ---------- File Cleanup Task ---------- */
/*
cron.schedule("60* * * * * *", () => {
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
        console.error(`Failed deleting ${file.uniqueFileName}:`, err);
      }
    } else {
      updatedMetadata.push(file);
    }
  });

  writeMetadata(updatedMetadata);
});
*/
/* ---------- Start Server ---------- */
server.listen(port, ip, () => {
  console.log(`Server running at http://localhost:${port}`);
});
