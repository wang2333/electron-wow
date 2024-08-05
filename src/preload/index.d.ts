import { Jimp as JimpType } from 'jimp'

import { ElectronAPI } from '@electron-toolkit/preload'
import {
  AssertClass,
  ClipboardClass,
  ImageWriterParameters,
  KeyboardClass,
  MouseClass,
  Point,
  Region,
  ScreenClass,
  Window
} from '@nut-tree/nut-js'

declare global {
  interface Window {
    electron: ElectronAPI
    api: Record<string, any>
    Jimp: JimpType
    nut: {
      Region
      clipboard: ClipboardClass
      keyboard: KeyboardClass
      mouse: MouseClass
      screen: ScreenClass
      assert: AssertClass
      straightTo: (target: Point | Promise<Point>) => Promise<Point[]>
      up: (px: number) => Promise<Point[]>
      down: (px: number) => Promise<Point[]>
      left: (px: number) => Promise<Point[]>
      right: (px: number) => Promise<Point[]>
      getWindows: () => Promise<Window[]>
      getActiveWindow: () => Promise<Window>
      loadImage: (parameters: string) => Promise<Image>
      saveImage: (parameters: ImageWriterParameters) => Promise<void>
      imageResource: (fileName: string) => Promise<Image>
      singleWord: (word: string) => WordQuery
      textLine: (line: string) => LineQuery
      windowWithTitle: (title: string | RegExp) => WindowQuery
      pixelWithColor: (color: RGBA) => ColorQuery
    }
  }
}
