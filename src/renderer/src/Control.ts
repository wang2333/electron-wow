import { Point } from '@nut-tree/nut-js'

const { mouse, straightTo: nutStraightTo, screen, Region } = window.nut
const Jimp = window.Jimp
// const cv = window.cv

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
export const grabRegion = async (x: number, y: number, width: number, height: number) => {
  // 定义你想要截图的区域
  const region = new Region(x, y, width, height)
  const image = await screen.grabRegion(region)

  const imageData = await image.toRGB() // 获取图像数据为 RGB 格式
  return imageData
}

/** 保存图片 */
export const saveImage = async (
  path: string,
  imageData: { width: number; height: number; data: Buffer }
) => {
  const buffer = Buffer.from(imageData.data)
  // 处理并保存图像
  const jimpImage = new Jimp({
    data: buffer,
    width: imageData.width,
    height: imageData.height
  })
  await jimpImage.writeAsync(`${window.api.imagePath}${path}`)
}

/** 读取图片 */
export const loadImage = async (path: string, callback: (err: string, src: string) => void) => {
  const image = await Jimp.read(`${window.api.imagePath}${path}`)
  image.getBase64(Jimp.MIME_PNG, callback)
}

/** 获取图像位置 */
export const getImagePosition = async (largeImagePath: string) => {
  // const src = cv.imread(largeImagePath)
  // console.log('👻 ~ src:', src)
  const imgElement = new Image()
  imgElement.src = largeImagePath
  imgElement.onload = function () {
    // const largeMat = cv.imread(imgElement)
  }
}
