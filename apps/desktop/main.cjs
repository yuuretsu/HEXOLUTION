const { app, BrowserWindow, Menu } = require("electron");
const path = require("path");

const DRAG_REGION_ID = "hexolution-desktop-drag";
const FULLSCREEN_CLASS = "hexolution-desktop-fullscreen";

const DESKTOP_CHROME_CSS = `
#${DRAG_REGION_ID} {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 38px;
  z-index: 2147483647;
  -webkit-app-region: drag;
  pointer-events: auto;
}
body.${FULLSCREEN_CLASS} #${DRAG_REGION_ID} {
  display: none !important;
}
`;

const ensureDragRegionScript = `
(() => {
  if (document.getElementById("${DRAG_REGION_ID}")) return;
  const el = document.createElement("div");
  el.id = "${DRAG_REGION_ID}";
  document.body.prepend(el);
})();
`;

const setFullscreenClassScript = (isFullscreen) =>
  `document.body.classList.toggle("${FULLSCREEN_CLASS}", ${isFullscreen ? "true" : "false"});`;

const installDesktopChrome = async (win) => {
  await win.webContents.insertCSS(DESKTOP_CHROME_CSS);
  await win.webContents.executeJavaScript(ensureDragRegionScript);
};

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    titleBarStyle: "hiddenInset",
    icon: path.join(__dirname, "../web/public/icon.png"),
    center: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
      acceptFirstMouse: true,
    },
  });

  Menu.setApplicationMenu(
    Menu.buildFromTemplate([{ role: "appMenu" }, { role: "windowMenu" }]),
  );

  mainWindow.on("enter-full-screen", () => {
    void mainWindow.webContents.executeJavaScript(setFullscreenClassScript(true));
  });

  mainWindow.on("leave-full-screen", () => {
    void mainWindow.webContents.executeJavaScript(setFullscreenClassScript(false));
  });

  mainWindow.webContents.on("did-finish-load", () => {
    void installDesktopChrome(mainWindow);
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    void mainWindow.loadURL(devServerUrl);
    mainWindow.webContents.openDevTools({ mode: "detach" });
    return;
  }

  const distIndex = app.isPackaged
    ? path.join(process.resourcesPath, "web-dist", "index.html")
    : path.join(__dirname, "../web/dist/index.html");
  void mainWindow.loadFile(distIndex);
};

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  app.quit();
});
