CREATE DATABASE IF NOT EXISTS m2pc;
USE m2pc;

CREATE TABLE IF NOT EXISTS uploaded_files (
  id INT AUTO_INCREMENT PRIMARY KEY,
  file_name VARCHAR(255) NOT NULL,
  unique_file_name VARCHAR(255),
  file_path TEXT,
  upload_time DATETIME,
  file_type_name VARCHAR(100),
  file_type_pages INT,
  file_type_page_per_sheet INT,
  file_type_layout VARCHAR(20),
  file_type_color VARCHAR(20),
  file_type_price DECIMAL(10,2),
  file_type_flip BOOLEAN,
  user_ip_address VARCHAR(45)
);