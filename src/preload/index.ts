import { contextBridge } from 'electron'
import jimp from 'jimp'
import path from 'path'
import * as fs from 'node:fs/promises'

import { electronAPI } from '@electron-toolkit/preload'
import nut from '@nut-tree/nut-js'
import cv from '@techstark/opencv-js'
import tesseract from './tesseract/tesseract.esm.min.js'

// const windows = windowManager.getWindows()
// // 遍历所有窗口，找到标题匹配的窗口
// for (const win of windows) {
//   if (win.getTitle().includes('下载')) {
//     win.setBounds({ x: 0, y: 0 })
//     break
//   }
// }

// Custom APIs for renderer
const api = {
  /** 获取资源路径 */
  getResourcePath: (filePath) => path.join(__dirname, '../../', filePath),
  readdir: (filePath) => fs.readdir(path.join(__dirname, '../../', filePath))
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
}
