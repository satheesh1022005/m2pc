// renderer.js
const { ipcRenderer, shell } = require("electron");

function appendToLog(message) {
  const statusDiv = document.getElementById("status");
  const entry = document.createElement("div");
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  statusDiv.appendChild(entry);
  statusDiv.scrollTop = statusDiv.scrollHeight;
}

function updateServerUrl(url) {
  const urlDiv = document.getElementById("server-url");
  urlDiv.textContent = `Server URL: ${url}`;
  urlDiv.style.display = "block";
}

function launchApplication() {
  appendToLog("Initializing servers...");
  disableButtons(true);
  ipcRenderer.send("start-servers");
}

function terminateApplication() {
  appendToLog("Stopping servers...");
  disableButtons(true);
  ipcRenderer.send("stop-servers");
}

function disableButtons(disabled) {
  document.getElementById("startButton").disabled = disabled;
  document.getElementById("stopButton").disabled = disabled;
}

ipcRenderer.on("server-status", (event, message) => {
  appendToLog(message);
  if (
    message.includes("successfully") ||
    message.includes("Error") ||
    message.includes("stopped")
  ) {
    disableButtons(false);
  }
});

ipcRenderer.on("server-output", (event, data) => {
  appendToLog(`${data.server}: ${data.output.trim()}`);
});

ipcRenderer.on("server-url", (event, url) => {
  updateServerUrl(url);
});

const link = document.getElementById("external-link");

link.addEventListener("click", (e) => {
  e.preventDefault();
  const url = link.getAttribute("href");
  shell.openExternal(url);
});
