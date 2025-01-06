// main.js
const { app, BrowserWindow, ipcMain } = require("electron");
const childProcess = require("child_process");
const path = require("path");

let mainWindow;
let serverProcesses = {};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile("index.html");
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

function startNodeServer() {
  return new Promise((resolve, reject) => {
    const serverDir = path.join(__dirname, "..", "server");
    console.log("Server Directory:", serverDir);

    const nodeServer = childProcess.spawn("node", ["server.js"], {
      cwd: serverDir,
      shell: true,
    });

    serverProcesses["node-server"] = nodeServer;

    nodeServer.stdout.on("data", (data) => {
      const output = data.toString();
      console.log("[Node Server]:", output);
      mainWindow.webContents.send("server-output", {
        server: "node-server",
        output: output,
      });
    });

    nodeServer.stderr.on("data", (data) => {
      console.error("[Node Server Error]:", data.toString());
      mainWindow.webContents.send("server-output", {
        server: "node-server",
        output: `ERROR: ${data.toString()}`,
      });
    });

    nodeServer.on("error", (error) => {
      console.error("Failed to start Node server:", error);
      reject(error);
    });

    // Give the server a moment to start
    setTimeout(() => resolve(nodeServer), 1000);
  });
}

function startReactApp() {
  return new Promise((resolve, reject) => {
    const clientDir = path.join(__dirname, "..", "client");
    console.log("Client Directory:", clientDir);

    const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
    const reactApp = childProcess.spawn(npmCommand, ["run", "dev"], {
      cwd: clientDir,
      shell: true,
    });

    serverProcesses["react-app"] = reactApp;

    reactApp.stdout.on("data", (data) => {
      const output = data.toString();
      console.log("[React App]:", output);
      mainWindow.webContents.send("server-output", {
        server: "react-app",
        output: output,
      });

      // Check for the Vite server URL
      if (output.includes("Local:")) {
        const match = output.match(/Local:\s+(http:\/\/\S+)/);
        if (match) {
          mainWindow.webContents.send("server-url", match[1]);
        }
      }
    });

    reactApp.stderr.on("data", (data) => {
      console.error("[React App Error]:", data.toString());
      mainWindow.webContents.send("server-output", {
        server: "react-app",
        output: `ERROR: ${data.toString()}`,
      });
    });

    reactApp.on("error", (error) => {
      console.error("Failed to start React app:", error);
      reject(error);
    });

    // Give the app a moment to start
    setTimeout(() => resolve(reactApp), 1000);
  });
}

ipcMain.on("start-servers", async (event) => {
  try {
    mainWindow.webContents.send("server-status", "Starting Node.js server...");
    await startNodeServer();

    mainWindow.webContents.send(
      "server-status",
      "Starting React application..."
    );
    await startReactApp();

    mainWindow.webContents.send(
      "server-status",
      "All servers started successfully!"
    );
  } catch (error) {
    mainWindow.webContents.send("server-status", `Error: ${error.message}`);
  }
});

ipcMain.on("stop-servers", () => {
  Object.entries(serverProcesses).forEach(([name, process]) => {
    if (process) {
      // On Windows, we need to kill the process tree
      if (process.platform === "win32") {
        childProcess.spawn("taskkill", ["/pid", process.pid, "/F", "/T"]);
      } else {
        process.kill("SIGTERM");
      }
      delete serverProcesses[name];
    }
  });

  // Additional cleanup for Windows
  if (process.platform === "win32") {
    childProcess.spawn("taskkill", ["/F", "/IM", "node.exe"], { shell: true });
  }

  mainWindow.webContents.send("server-status", "All servers stopped");
});

app.on("before-quit", () => {
  Object.values(serverProcesses).forEach((process) => {
    if (process) {
      process.kill("SIGTERM");
    }
  });
});
