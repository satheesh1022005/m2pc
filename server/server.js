const express = require("express");
const multer = require("multer");
const app = express();
const port = 3000;

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, file.originalname),
});
const upload = multer({ storage });

app.use(express.static("public"));

// Endpoint to handle file uploads
app.post("/upload", upload.single("file"), (req, res) => {
  res.send("File uploaded successfully!");
});
app.get("/", (req, res) => {
  res.send("Hello World");
});
// Start the server
app.listen(port, () => {
  console.log(`Server running at http://192.168.x.x:${port}`);
});
