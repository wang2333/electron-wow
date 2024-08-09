import { contextBridge } from 'electron'
import jimp from 'jimp'

import { electronAPI } from '@electron-toolkit/preload'
import nut from '@nut-tree/nut-js'
import cv from '@techstark/opencv-js'
import tesseract from './tesseract/tesseract.esm.min.js'

// Custom APIs for renderer
const api = {}

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
