import { app, BrowserWindow, dialog, globalShortcut, ipcMain, shell } from 'electron'
import fs from 'fs-extra'
import path, { join } from 'path'
import { autoUpdater } from 'electron-updater'

import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

let mainWindow

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 700,
    height: 600,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: false, // 关闭上下文隔离
      nodeIntegration: true, // 开启node集成
      backgroundThrottling: false, // 禁用后台节流
      webSecurity: false // 在开发环境下禁用 web 安全策略
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.webContents.openDevTools()
}

function checkForUpdates() {
  // 配置更新服务器地址
  autoUpdater.setFeedURL({
    provider: 'generic',
    url: 'https://github.com/wang2333/electron-wow/releases/download/latest'
  })

  // 检查更新出错
  autoUpdater.on('error', (err) => {
    // dialog.showErrorBox('更新出错', err.message)
    console.log('error', err)
  })

  // 检查是否有更新
  autoUpdater.on('checking-for-update', () => {
    console.log('checking-for-update')
  })

  // 有可用更新
  autoUpdater.on('update-available', () => {
    dialog
      .showMessageBox({
        type: 'info',
        title: '应用更新',
        message: '发现新版本,是否现在更新?',
        buttons: ['是', '否']
      })
      .then((buttonIndex) => {
        if (buttonIndex.response === 0) {
          autoUpdater.downloadUpdate()
        }
      })
  })

  // 没有可用更新
  autoUpdater.on('update-not-available', () => {
    console.log('update-not-available')
  })

  // 更新下载进度
  autoUpdater.on('download-progress', (progressObj) => {
    console.log('下载进度:', progressObj.percent)
  })

  // 更新下载完毕
  autoUpdater.on('update-downloaded', () => {
    autoUpdater.quitAndInstall()
    // dialog
    //   .showMessageBox({
    //     title: '安装更新',
    //     message: '更新下载完毕,应用将重启并进行安装'
    //   })
    //   .then(() => {
    //     autoUpdater.quitAndInstall()
    //   })
  })

  // 执行自动更新检查
  autoUpdater.checkForUpdates()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // 添加选择文件夹的IPC处理
  ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    })

    if (!result.canceled) {
      return result.filePaths[0]
    }
    return null
  })

  // 添加复制文件夹的IPC处理
  ipcMain.handle('copy-folder', async (_, targetPath) => {
    try {
      const sourcePath = path.join(app.getAppPath(), 'resources/WR')
      await fs.copy(sourcePath, path.join(targetPath, 'WR'))
      return true
    } catch (error) {
      console.error('复制文件夹失败:', error)
      throw error
    }
  })

  createWindow()
  checkForUpdates()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('ready', () => {
  // 注册全局快捷键
  globalShortcut.unregister('F1')
  globalShortcut.register('F1', () => {
    mainWindow.webContents.send('shortcut-pressed', 'F1')
  })

  globalShortcut.unregister('F2')
  globalShortcut.register('F2', () => {
    mainWindow.webContents.send('shortcut-pressed', 'F2')
  })

  // 添加 F3 快捷键
  globalShortcut.unregister('F3')
  globalShortcut.register('F3', () => {
    mainWindow.webContents.send('shortcut-pressed', 'F3')
  })
})

app.on('will-quit', () => {
  // 注销所有快捷键
  globalShortcut.unregisterAll()
})
