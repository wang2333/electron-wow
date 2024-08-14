import { Point } from '@nut-tree/nut-js'
import { DEGREES_PER_PIXEL, GAME_POSITION } from '@renderer/constants'
import { Key } from './Key'

const { mouse, straightTo: nutStraightTo, screen, Region, keyboard } = window.nut

keyboard.config.autoDelayMs = 0 // 设置键盘按键间隔（可选）
mouse.config.autoDelayMs = 100 // 设置鼠标点击间隔（可选）
mouse.config.mouseSpeed = 100000 // 设置鼠标移动速度（可选）

enum Button {
  LEFT = 0,
  MIDDLE = 1,
  RIGHT = 2
}

export const straightTo = (position: Point | Promise<Point>) => {
  return nutStraightTo(position)
}

/** 获取指定位置色值 */
export const colorAt = async (point: Point | Promise<Point>) => {
  const rgba = await screen.colorAt(point)
  return rgba.toHex()
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
export const mouseMove = async (position: Point | Promise<Point>) => {
  return await mouse.move(straightTo(position))
}

/** 单击右键 */
export const mouseRightClick = async (position?: Point | Promise<Point>) => {
  if (position) {
    await mouseMove(position)
  }
  await mouse.rightClick()
}

/** 单击左键 */
export const mouseLeftClick = async (position?: Point | Promise<Point>) => {
  if (position) {
    await mouseMove(position)
  }
  await mouse.leftClick()
}

/** 螺旋点击 */
export const clickInSpiral = async (
  cx: number,
  cy: number,
  r: number,
  step = 10,
  angleStep = 5
) => {
  let angle = 0
  let currentRadius = 0

  while (currentRadius <= r) {
    // 计算当前点的 x, y 坐标
    const x = cx + currentRadius * Math.cos(angle * (Math.PI / 180))
    const y = cy + currentRadius * Math.sin(angle * (Math.PI / 180))

    // 移动鼠标到计算的点并点击
    await mouseRightClick({ x, y })

    // 更新角度和半径
    angle += angleStep
    currentRadius += step * (angleStep / 360) // 逐渐增加半径
  }
}

/** 矩形点击 */
export const clickInRect = async (
  x1: number,
  y1: number,
  width: number,
  height: number,
  stepX: number,
  stepY: number
) => {
  const x2 = x1 + width
  const y2 = y1 + height

  for (let x = x1; x <= x2; x += stepX) {
    for (let y = y1; y <= y2; y += stepY) {
      // 移动到目标位置并点击
      await mouseRightClick({ x, y })
    }
  }
}

/** 圆形点击 */
export const clickInCircle = async (cx: number, cy: number, r: number, step: number) => {
  for (let angle = 0; angle < 360; angle += step) {
    // 计算当前角度的 x 和 y 偏移
    const xOffset = r * Math.cos((angle * Math.PI) / 180)
    const yOffset = r * Math.sin((angle * Math.PI) / 180)

    // 计算点击位置
    const x = cx + xOffset
    const y = cy + yOffset

    // 移动到目标位置并点击
    await mouseRightClick({ x, y })
  }
}

/** 按键 */
export const pressKeyDown = async (key: Key) => {
  await keyboard.pressKey(key)
}

/** 释放按键 */
export const pressKeyUp = async (key: Key) => {
  await keyboard.releaseKey(key)
}

// 单次按键
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

/** 转向 */
export const turning = async (range: number) => {
  // 移动到中心点
  await mouse.setPosition({ x: GAME_POSITION.x, y: GAME_POSITION.y })
  const distance = GAME_POSITION.x - DEGREES_PER_PIXEL * range
  // // 按下右键
  await mouse.pressButton(Button.RIGHT)
  // // 移动到结束位置
  await mouse.move(straightTo({ x: distance, y: GAME_POSITION.y }))
  // // 释放右键
  await mouse.releaseButton(Button.RIGHT)
}
