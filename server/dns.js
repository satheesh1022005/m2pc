const dgram = require("dgram");
const http = require("http");
const os = require("os");

// Function to get the hotspot IP address
function getHostIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (
        iface.family === "IPv4" &&
        !iface.internal &&
        (iface.address.startsWith("192.168.") ||
          iface.address.startsWith("172."))
      ) {
        return iface.address;
      }
    }
  }
  return "127.0.0.1"; // Fallback to localhost if no suitable IP is found
}

// Function to parse domain name from DNS query
function parseDomainName(buffer, offset) {
  const labels = [];
  let len = buffer[offset];
  offset++;

  while (len > 0) {
    labels.push(buffer.slice(offset, offset + len).toString());
    offset += len;
    len = buffer[offset];
    offset++;
  }

  return labels.join(".");
}

// DNS Server
function startDnsServer() {
  const dnsServer = dgram.createSocket("udp4");
  const hostIp = getHostIp();

  dnsServer.on("error", (err) => {
    console.log(`DNS Server error:\n${err.stack}`);
    dnsServer.close();
  });

  dnsServer.on("message", (msg, rinfo) => {
    const queriedDomain = parseDomainName(msg, 12);

    console.log(`DNS Query for: ${queriedDomain}`);

    // Create DNS response
    const response = Buffer.from(msg);
    response[2] = 0x81; // Response + Authoritative Answer
    response[3] = 0x80; // No error
    response[7] = 1; // Answer count = 1

    // Answer section: Point to host IP
    const answer = Buffer.from([
      0xc0,
      0x0c, // Pointer to the queried domain
      0x00,
      0x01, // Type A
      0x00,
      0x01, // Class IN
      0x00,
      0x00,
      0x00,
      0x3c, // TTL (60 seconds)
      0x00,
      0x04, // Data length (4 bytes for IPv4)
      ...hostIp.split(".").map((octet) => parseInt(octet)), // Host IP address
    ]);

    dnsServer.send(
      Buffer.concat([response, answer]),
      rinfo.port,
      rinfo.address
    );
  });

  dnsServer.bind(53, "0.0.0.0", () => {
    console.log(`DNS Server running on port 53 and resolving to ${hostIp}`);
  });
}

// HTTP Redirect Server
function startHttpRedirect() {
  const hostIp = getHostIp();

  const server = http.createServer((req, res) => {
    console.log(`HTTP Request for: ${req.url}`);
    res.writeHead(302, { Location: `http://${hostIp}:5173` });
    res.end();
  });

  server.listen(80, "0.0.0.0", () => {
    console.log(`HTTP Redirect Server running on port 80`);
  });

  server.on("error", (e) => {
    if (e.code === "EADDRINUSE") {
      console.log("Port 80 is in use. Please stop any other service using it.");
    } else if (e.code === "EACCES") {
      console.log(
        "Permission denied. Please run with administrator privileges."
      );
    } else {
      console.log("HTTP Server error:", e);
    }
  });
}

// Main function
function main() {
  try {
    startDnsServer();
    startHttpRedirect();
  } catch (error) {
    console.error("Error starting servers:", error);
  }
}

main();
