import { Mat, Point, Scalar } from '@techstark/opencv-js'

const Jimp = window.Jimp
const cv = window.cv
const Tesseract = window.tesseract

// 定义特征截图的大小
const CROP_SIZE = 40

/** base64图片生成img节点 */
export const base64ToImage = async (base64: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.src = base64
    img.onload = () => resolve(img)
    img.onerror = (err) => reject(err)
  })
}

/** 加载Base64图像并转换为OpenCV矩阵 */
export const base64ToMat = async (base64: string) => {
  const imageElement = await base64ToImage(base64)
  return cv.imread(imageElement)
}

/** 根据canvas获取base64图片 */
export const matToBase64 = (mat: Mat) => {
  const canvas = document.createElement('canvas')
  cv.imshow(canvas, mat)
  return canvas.toDataURL('image/png')
}

/** 根据图片路径转换为base64图片 */
export const imageToBase64 = async (path: string) => {
  const image = await Jimp.read(path)
  const base64 = await image.getBase64Async(Jimp.MIME_PNG)
  return base64
}

/** 读取图像并转换为OpenCV矩阵 */
export const imageToMat = async (path: string) => {
  const base64 = await imageToBase64(path)
  const imageElement = await base64ToImage(base64)
  return cv.imread(imageElement)
}

/** OpenCV矩阵渲染到指定canvas */
export const matToCanvas = (mat: Mat, canvas: string) => {
  cv.imshow(canvas, mat)
}

/** 计算矩阵匹配点的中心点 */
const calculateCenter = (point: Point, mat: Mat) => {
  return new cv.Point(point.x + mat.cols / 2, point.y + mat.rows / 2)
}

/** 计算两个点之间的距离 */
const calculateDistance = (point1: Point, point2: Point): number => {
  return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2))
}

/** 计算两个点之间的角度，以正北方向为0度 */
const calculateAngle = (centerCurrent: Point, centerTarget: Point): number => {
  let angle =
    Math.atan2(centerTarget.x - centerCurrent.x, centerCurrent.y - centerTarget.y) * (180 / Math.PI)
  if (angle > 180) {
    angle -= 360
  } else if (angle < -180) {
    angle += 360
  }
  return angle
}

/** 绘制矩形框 */
const drawRectangle = (paneMat: Mat, topLeft: Point, mat: Mat, color: Scalar): void => {
  const bottomRight = new cv.Point(topLeft.x + mat.cols, topLeft.y + mat.rows)
  cv.rectangle(paneMat, topLeft, bottomRight, color, 2, cv.LINE_8, 0)
}

/** 绘制连线 */
const drawLine = (paneMat: Mat, point1: Point, point2: Point, color: Scalar): void => {
  cv.line(paneMat, point1, point2, color, 2, cv.LINE_8, 0)
}

// 确保裁剪不超出边界
const safeCrop = (src: Mat, centerX: number, centerY: number, size: number) => {
  const x = Math.max(0, Math.min(centerX - Math.floor(size / 2), src.cols - size))
  const y = Math.max(0, Math.min(centerY - Math.floor(size / 2), src.rows - size))
  const rect = new cv.Rect(x, y, size, size)
  return src.roi(rect)
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
  await jimpImage.writeAsync(path)
  const base64 = await jimpImage.getBase64Async(Jimp.MIME_PNG)
  return base64
}

/** 获取图像位置并绘制匹配结果 */
export const getImagePosition = async (
  path: string,
  current: { leftImg: string; rightImg: string; topImg: string; bottomImg: string },
  target: { leftImg: string; rightImg: string; topImg: string; bottomImg: string }
) => {
  // 读取大图并转换为OpenCV矩阵
  const panelMat = await imageToMat(path)

  // 转为灰度图像
  cv.cvtColor(panelMat, panelMat, cv.COLOR_RGBA2GRAY)

  // 初始化最佳匹配结果
  let bestMatch = { distance: Infinity, angle: 0, score: -1 }

  const directions = ['leftImg', 'rightImg', 'topImg', 'bottomImg']

  // 遍历每个方向进行匹配
  for (const direction of directions) {
    const matchResult = await matchAndDraw(panelMat, current[direction], target[direction])

    // 更新最佳匹配结果
    if (matchResult.score > bestMatch.score) {
      bestMatch = matchResult
    }
  }

  // 显示最终的匹配结果图像
  cv.imshow('canvasOutput', panelMat)

  // 释放大图矩阵的内存
  panelMat.delete()

  // 返回最佳匹配的距离和角度
  return { distance: bestMatch.distance, angle: bestMatch.angle, score: bestMatch.score }
}

/** 进行模板匹配并绘制匹配框和连线 */
const matchAndDraw = async (paneMat: Mat, currentImg: string, targetImg: string) => {
  const curentMat = await base64ToMat(currentImg)
  const targetMat = await base64ToMat(targetImg)

  // 转为灰度图像
  cv.cvtColor(curentMat, curentMat, cv.COLOR_RGBA2GRAY)
  cv.cvtColor(targetMat, targetMat, cv.COLOR_RGBA2GRAY)

  // 进行模板匹配
  const resultCurrent = new cv.Mat()
  const resultTarget = new cv.Mat()
  const mask = new cv.Mat()

  cv.matchTemplate(paneMat, curentMat, resultCurrent, cv.TM_CCOEFF_NORMED, mask)
  cv.matchTemplate(paneMat, targetMat, resultTarget, cv.TM_CCOEFF_NORMED, mask)

  const maxPointCurrent = cv.minMaxLoc(resultCurrent, mask).maxLoc
  const maxPointTarget = cv.minMaxLoc(resultTarget, mask).maxLoc

  // 计算匹配中心点
  const centerCurrent = calculateCenter(maxPointCurrent, curentMat)
  const centerTarget = calculateCenter(maxPointTarget, targetMat)

  // 计算距离和角度
  const distance = calculateDistance(centerCurrent, centerTarget)
  const angle = calculateAngle(centerCurrent, centerTarget)

  // 获取匹配度（分数）
  const score = cv.minMaxLoc(resultTarget, mask).maxVal

  // 绘制匹配框和连线
  drawRectangle(paneMat, maxPointCurrent, curentMat, new cv.Scalar(255, 0, 0, 255)) // 红色框表示 current
  drawRectangle(paneMat, maxPointTarget, targetMat, new cv.Scalar(0, 255, 0, 255)) // 绿色框表示 target
  drawLine(paneMat, centerCurrent, centerTarget, new cv.Scalar(0, 0, 255, 255)) // 蓝色线

  // 释放内存
  curentMat.delete()
  targetMat.delete()
  resultCurrent.delete()
  resultTarget.delete()
  mask.delete()

  return { distance, angle, score }
}

/** 获取图片的4个特征小图 */
export const getImageFourFeature = async (path: string) => {
  const src = await imageToMat(path)

  // Calculate the center point
  const centerX = Math.floor(src.cols / 2)
  const centerY = Math.floor(src.rows / 2)

  const centerImg = safeCrop(src, centerX, centerY, CROP_SIZE)
  const leftImg = safeCrop(src, centerX - CROP_SIZE, centerY, CROP_SIZE)
  const rightImg = safeCrop(src, centerX + CROP_SIZE, centerY, CROP_SIZE)
  const topImg = safeCrop(src, centerX, centerY - CROP_SIZE, CROP_SIZE)
  const bottomImg = safeCrop(src, centerX, centerY + CROP_SIZE, CROP_SIZE)

  const obj = {
    leftImg: matToBase64(leftImg),
    rightImg: matToBase64(rightImg),
    topImg: matToBase64(topImg),
    bottomImg: matToBase64(bottomImg)
  }

  // Clean up
  src.delete()
  centerImg.delete()
  leftImg.delete()
  rightImg.delete()
  topImg.delete()
  bottomImg.delete()

  return obj
}

/** 旋转找图 */
export const processImages = async (queryImg: string, trainImg: string) => {
  // 1. 加载模板和目标图像
  const src = await imageToMat(queryImg)
  const template = await imageToMat(trainImg)

  // 转为灰度图像
  cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY)
  cv.cvtColor(template, template, cv.COLOR_RGBA2GRAY)

  let bestMatchVal = -1
  let bestAngle = 0
  let bestLocation = { x: 0, y: 0 }

  // 2. 依次旋转模板图像
  for (let angle = 0; angle < 360; angle += 2) {
    // 以2度为步长
    // 计算旋转矩阵
    const center = new cv.Point(template.cols / 2, template.rows / 2)
    const rotMat = cv.getRotationMatrix2D(center, angle, 1.0)

    // 旋转图像
    const rotatedTemplate = new cv.Mat()
    const dsize = new cv.Size(template.cols, template.rows)
    cv.warpAffine(
      template,
      rotatedTemplate,
      rotMat,
      dsize,
      cv.INTER_LINEAR,
      cv.BORDER_CONSTANT,
      new cv.Scalar()
    )

    // 3. 执行模板匹配
    const result = new cv.Mat()
    const mask = new cv.Mat()
    cv.matchTemplate(src, rotatedTemplate, result, cv.TM_CCOEFF_NORMED, mask)

    // 4. 找到最佳匹配
    const minMax = cv.minMaxLoc(result, mask)
    const maxVal = minMax.maxVal
    const maxLoc = minMax.maxLoc

    if (maxVal > bestMatchVal) {
      bestMatchVal = maxVal
      bestAngle = angle
      bestLocation = maxLoc
    }

    // 清理内存
    rotatedTemplate.delete()
    result.delete()
    mask.delete()
  }

  // 清理内存
  src.delete()
  template.delete()

  return {
    bestAngle,
    bestLocation,
    bestMatchVal
  }
}

/** 在大图中找到小图的位置 */
export const findImageInLargeImage = async (largeImagePath: string, smallImageBase64: string) => {
  // 读取大图并转换为OpenCV矩阵
  const largeMat = await imageToMat(largeImagePath)
  // 加载小图并转换为OpenCV矩阵
  const smallMat = await imageToMat(smallImageBase64)

  // 转为灰度图像
  cv.cvtColor(largeMat, largeMat, cv.COLOR_RGBA2GRAY)
  cv.cvtColor(smallMat, smallMat, cv.COLOR_RGBA2GRAY)

  // 创建矩阵以存储匹配结果
  const result = new cv.Mat()
  const mask = new cv.Mat()

  // 对大图和小图进行模板匹配
  cv.matchTemplate(largeMat, smallMat, result, cv.TM_CCOEFF_NORMED, mask)

  // 获取匹配结果的最优位置
  const minMaxLocResult = cv.minMaxLoc(result, mask)
  const maxPoint = minMaxLocResult.maxLoc

  // 计算小图在大图上的中心点
  const center = calculateCenter(maxPoint, smallMat)

  // 计算距离和角度
  const distance = 0 // 不需要计算距离，因为只匹配一个小图
  const angle = 0 // 不需要计算角度，因为只匹配一个小图

  // 绘制小图的匹配框
  const color = new cv.Scalar(255, 0, 0, 255) // 红色框
  drawRectangle(largeMat, maxPoint, smallMat, color)

  // 显示最终的匹配结果图像
  cv.imshow('canvasOutput', largeMat)

  // 释放内存
  largeMat.delete()
  smallMat.delete()
  result.delete()
  mask.delete()

  // 返回匹配的位置和中心点
  return { position: maxPoint, center, distance, angle }
}

/** 绘制路径点 */
export const drawRoute = async () => {
  // 获取画布元素和上下文
  const canvas = document.getElementById('canvasOutput') as HTMLCanvasElement
  if (!canvas) return

  // 清空canvas
  const ctx = canvas.getContext('2d')
  ctx!.fillStyle = 'white'
  ctx!.fillRect(0, 0, canvas.width, canvas.height)

  const mat = cv.imread(canvas)

  // 定义坐标点数组
  const points = [
    { x: 50, y: 50 },
    { x: 100, y: 100 },
    { x: 150, y: 50 },
    { x: 200, y: 100 }
  ]

  // 将坐标点转换为 OpenCV 的 Point 数组并绘制线条
  for (let i = 0; i < points.length - 1; i++) {
    const pt1 = new cv.Point(points[i].x, points[i].y)
    const pt2 = new cv.Point(points[i + 1].x, points[i + 1].y)
    drawLine(mat, pt1, pt2, new cv.Scalar(255, 0, 0, 255))
  }

  // 将绘制的内容显示在画布上
  cv.imshow('canvasOutput', mat)
  mat.delete() // 释放内存
}

/** 使用 Tesseract.js 进行 OCR 识别 */
export const recognize = async (base64: string) => {
  const mat = await base64ToMat(base64)

  const dst = new cv.Mat()

  // 将图像转换为灰度图
  cv.cvtColor(mat, dst, cv.COLOR_RGBA2GRAY)

  // 将结果显示在canvas中
  cv.imshow('canvasOutput', dst)

  // 如果需要将灰度图转换回base64
  const grayBase64 = matToBase64(dst)

  // 记得释放资源
  mat.delete()
  dst.delete()

  const { data } = await Tesseract.recognize(
    grayBase64,
    'eng', // 可以改为 'digits' 或其他语言模型
    {
      // logger: (m) => console.log(m)
      // langPath: './eng.traineddata' // 模型的存放路径
    }
  )
  return data.text.trim()
}
