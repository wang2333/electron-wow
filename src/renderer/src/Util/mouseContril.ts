import { Point } from '@nut-tree/nut-js'
import { Key } from './Key'

const { mouse, straightTo: nutStraightTo, screen, Region, keyboard } = window.nut

keyboard.config.autoDelayMs = 0

export const straightTo = (position: Point | Promise<Point>) => {
  return nutStraightTo(position)
}

/** 指定区域截图 */
export const grabRegion = async (x: number, y: number, width: number, height: number) => {
  // 定义你想要截图的区域
  const region = new Region(x, y, width, height)
  const image = await screen.grabRegion(region)

  const imageData = await image.toRGB() // 获取图像数据为 RGB 格式
  return imageData
}

/** 移动鼠标 */
export const mouseMove = async (position: Point[] | Promise<Point[]>) => {
  return await mouse.move(position)
}

/** 单击右键 */
export const mouseRightClick = async (position: Point[] | Promise<Point[]>) => {
  mouseMove(position)
  return await mouse.rightClick()
}

/** 单击左键 */
export const mouseLeftClick = async (position: Point[] | Promise<Point[]>) => {
  mouseMove(position)
  return await mouse.leftClick()
}

/** 按键 */
export const pressKeyDown = async (key: Key) => {
  await keyboard.pressKey(key)
}
/** 释放按键 */
export const pressKeyUp = async (key: Key) => {
  await keyboard.releaseKey(key)
}

export const pressKey = async (key: Key) => {
  await keyboard.pressKey(key)
  await keyboard.releaseKey(key)
}

/** 长按键 */
export const pressKeyLong = async (key: Key, duration: number) => {
  await keyboard.pressKey(key)
  await new Promise((resolve) => setTimeout(resolve, duration))
  await keyboard.releaseKey(key)
}
