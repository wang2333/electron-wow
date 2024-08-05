import { Point } from '@nut-tree/nut-js'
import cv from 'opencv4nodejs'
const { mouse, straightTo: nutStraightTo, screen, Region } = window.nut
const Jimp = window.Jimp

export const straightTo = (position: Point | Promise<Point>) => {
  return nutStraightTo(position)
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

/** 指定区域截图 */
export const grabRegion = async (
  fileName: string,
  x: number,
  y: number,
  width: number,
  height: number
) => {
  // 定义你想要截图的区域
  const region = new Region(x, y, width, height)
  const image = await screen.grabRegion(region)

  const imageData = await image.toRGB() // 获取图像数据为 RGB 格式
  const buffer = Buffer.from(imageData.data)

  // 处理并保存图像
  const jimpImage = new Jimp({
    data: buffer,
    width: image.width,
    height: image.height
  })

  const savePath = fileName
  await jimpImage.writeAsync(savePath)
}

/** 获取图像位置 */
export const getImagePosition = async (largeImagePath: string, smallImagePath) => {
  // 设定小图尺寸
  const smallWidth = 100
  const smallHeight = 100

  // 使用 OpenCV 进行模板匹配，寻找小图在大图中的位置
  const largeMat = cv.imread(largeImagePath)
  const smallMat = cv.imread(smallImagePath)

  const matched = largeMat.matchTemplate(smallMat, cv.TM_CCOEFF_NORMED)
  const minMax = matched.minMaxLoc()
  const {
    maxLoc: { x: foundX, y: foundY },
    maxVal
  } = minMax

  console.log(`小图匹配结果: 坐标(${foundX}, ${foundY}), 相似度: ${maxVal}`)

  // 可视化匹配结果，标记匹配区域
  const resultImage = largeMat.copy()
  resultImage.drawRectangle(
    new cv.Point2(foundX, foundY),
    new cv.Point2(foundX + smallWidth, foundY + smallHeight),
    new cv.Vec(0, 255, 0), // 绿色矩形框
    2, // 线条宽度
    cv.LINE_8
  )

  // 保存标记后的大图
  const resultImagePath = 'result-image.png'
  cv.imwrite(resultImagePath, resultImage)
  console.log(`标记结果已保存至: ${resultImagePath}`)
}
