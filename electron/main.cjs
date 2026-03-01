const { app, BrowserWindow, Menu } = require('electron')
const path = require('path')

function createWindow() {
  const mainWindow = new BrowserWindow({
    titleBarStyle: 'hiddenInset',
    icon: path.join(__dirname, '..', 'public', 'icon.png'),
    center: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs'),
      backgroundThrottling: false,
      acceptFirstMouse: true,
      acceleratedWidget: true,
    },
  })

  const template = [
    { role: 'appMenu' },
    { role: 'windowMenu' }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)

  const devServerUrl = process.env.VITE_DEV_SERVER_URL

  mainWindow.on('enter-full-screen', () => {
    mainWindow.webContents.send('fullscreen-state', true);
  });

  mainWindow.on('leave-full-screen', () => {
    mainWindow.webContents.send('fullscreen-state', false);
  });

  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
    return
  }

  mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  app.quit()
})
