import { contextBridge } from 'electron'
import jimp from 'jimp'
import { windowManager } from 'node-window-manager'
import * as fs from 'node:fs/promises'
import path from 'path'

import { electronAPI } from '@electron-toolkit/preload'
import nut from '@nut-tree/nut-js'
import cv from '@techstark/opencv-js'
import tesseract from './tesseract/tesseract.esm.min.js'

const windows = windowManager.getWindows()
// 遍历所有窗口，找到标题匹配的窗口
for (const win of windows) {
  if (win.getTitle().includes('魔兽世界')) {
    win.restore()
    win.setBounds({ x: 0, y: 400, width: 800, height: 600 })
    win.bringToTop()
    break
  }
}

// Custom APIs for renderer
const api = {
  /** 获取资源路径 */
  getResourcePath: (filePath: string) => path.join(__dirname, '../../', filePath),
  /** 获取资源目录 */
  readdir: (filePath: string) => fs.readdir(path.join(__dirname, '../../', filePath)),
  /** 读取文件 */
  readFile: (filePath: string) => fs.readFile(path.join(__dirname, '../../', filePath))
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('nut', nut)
    contextBridge.exposeInMainWorld('Jimp', jimp)
    contextBridge.exposeInMainWorld('cv', cv)
    contextBridge.exposeInMainWorld('tesseract', tesseract)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.api = api
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.nut = nut
  // @ts-ignore (define in dts)
  window.Jimp = jimp
  // @ts-ignore (define in dts)
  window.cv = cv
  // @ts-ignore (define in dts)
  window.tesseract = tesseract
  // @ts-ignore (define in dts)
}
