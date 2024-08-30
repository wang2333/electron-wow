import { Mat, Point, Scalar } from '@techstark/opencv-js'

const Jimp = window.Jimp
const cv = window.cv
const Tesseract = window.tesseract

// 定义特征截图的大小
const CROP_SIZE = 30
/** 雷达到指针x间距 */
export const leidaPaddingX = 70
/** 雷达到指针y间距 */
export const leidaPaddingY = 65
/** 雷达指针x坐标 */
export const leidaPointerX = 1168
/** 雷达指针y坐标 */
export const leidaPointerY = 130
/** 雷达指针宽度 */
export const leidaPointerWidth = 18
/** 雷达指针高度 */
export const leidaPointerHeight = 18

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
export const calculateCenter = (point: Point, mat: Mat) => {
  return new cv.Point(point.x + mat.cols / 2, point.y + mat.rows / 2)
}

/** 计算两个点之间的距离 */
export const calculateDistance = (point1: Point, point2: Point): number => {
  return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2))
}

/** 计算两个点之间的角度，以正北方向为0度 */
export const calculateAngle = (current: Point, target: Point): number => {
  let angle = 0
  // 目标点在左上
  if (current.x > target.x && current.y > target.y) {
    angle = Math.atan2(current.x - target.x, current.y - target.y) * (180 / Math.PI)
  }
  // 目标点在右上
  if (current.x < target.x && current.y > target.y) {
    angle = -1 * (Math.atan2(target.x - current.x, current.y - target.y) * (180 / Math.PI))
  }
  // 目标点在左下
  if (current.x > target.x && current.y < target.y) {
    angle = 180 - Math.atan2(current.x - target.x, target.y - current.y) * (180 / Math.PI)
  }
  // 目标点在右下
  if (current.x < target.x && current.y < target.y) {
    angle = -1 * (180 - Math.atan2(target.x - current.x, target.y - current.y) * (180 / Math.PI))
  }

  return angle
}

/** 绘制矩形框 */
export const drawRectangle = (paneMat: Mat, topLeft: Point, mat: Mat, color: Scalar): void => {
  const bottomRight = new cv.Point(topLeft.x + mat.cols, topLeft.y + mat.rows)
  cv.rectangle(paneMat, topLeft, bottomRight, color, 2, cv.LINE_8, 0)
}

/** 绘制连线 */
export const drawLine = (paneMat: Mat, point1: Point, point2: Point, color: Scalar): void => {
  cv.line(paneMat, point1, point2, color, 2, cv.LINE_8, 0)
}

// 确保裁剪不超出边界
export const safeCrop = (
  src: Mat,
  centerX: number,
  centerY: number,
  width: number,
  height: number
) => {
  const x = centerX - Math.floor(width / 2)
  const y = centerY - Math.floor(height / 2)
  const rect = new cv.Rect(x, y, width, height)
  return src.roi(rect)
}

/** 保存图片 */
export const imageDataToBase64 = async (
  imageData: { width: number; height: number; data: Buffer },
  path?: string
) => {
  const buffer = Buffer.from(imageData.data)
  // 处理并保存图像
  const jimpImage = new Jimp({
    data: buffer,
    width: imageData.width,
    height: imageData.height
  })
  if (path) {
    await jimpImage.writeAsync(path)
  }
  const base64 = await jimpImage.getBase64Async(Jimp.MIME_PNG)
  return base64
}

/** 获取图像位置并绘制匹配结果 */
export const getImagePosition = async (
  targetBase64: string,
  target: { leftImg: string; rightImg: string; topImg: string; bottomImg: string },
  current: { leftImg: string; rightImg: string; topImg: string; bottomImg: string }
) => {
  // 读取大图并转换为OpenCV矩阵
  const mat = await base64ToMat(targetBase64)

  // 转为灰度图像
  // cv.cvtColor(mat, mat, cv.COLOR_RGBA2GRAY)

  // 初始化最佳匹配结果
  let bestMatch: any = null

  const directions = [
    'leftImg',
    'rightImg',
    'topImg',
    'bottomImg'
    // 'leftTopImg'
    // 'leftBottomImg',
    // 'rightTopImg',
    // 'rightBottomImg'
  ]

  // 遍历每个方向进行匹配
  for (const direction of directions) {
    const matchResult = await matchAndDraw(mat, current[direction], target[direction])

    // 如果当前的 bestMatch 还没有初始化，则初始化它
    if (!bestMatch) {
      bestMatch = matchResult
    }

    // 检查是否存在相同的 distance 和 angle
    if (
      bestMatch &&
      matchResult.score > 0.9 &&
      matchResult.distance === bestMatch.distance &&
      matchResult.angle === bestMatch.angle
    ) {
      // 如果找到相同的 distance 和 angle，返回这条数据
      bestMatch = matchResult
    }
  }

  cv.imshow('canvasOutput2', mat)
  // 释放大图矩阵的内存
  mat.delete()

  // 返回最佳匹配的距离和角度
  return {
    distance: +bestMatch.distance,
    angle: +bestMatch.angle,
    score: bestMatch.score === 1 ? 0 : bestMatch.score
  }
}

/** 进行模板匹配并绘制匹配框和连线 */
const matchAndDraw = async (paneMat: Mat, currentImg: string, targetImg: string) => {
  const [curentMat, targetMat] = await Promise.all([
    base64ToMat(currentImg),
    base64ToMat(targetImg)
  ])

  // 转为灰度图像
  // cv.cvtColor(curentMat, curentMat, cv.COLOR_RGBA2GRAY)
  // cv.cvtColor(targetMat, targetMat, cv.COLOR_RGBA2GRAY)

  // 对图像进行二值化处理
  // cv.threshold(curentMat, curentMat, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU)
  // cv.threshold(targetMat, targetMat, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU)

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

  return { distance: +distance, angle: +angle, score: +score === 1 ? 0 : +score }
}

/** 获取图片的4个特征小图 */
export const getImageFourFeature = async (base64: string) => {
  const src = await base64ToMat(base64)

  // Calculate the center point
  const centerX = Math.floor(src.cols / 2)
  const centerY = Math.floor(src.rows / 2)

  const centerImg = safeCrop(src, centerX, centerY, leidaPointerWidth, leidaPointerHeight)
  const leftImg = safeCrop(src, centerX - CROP_SIZE, centerY, CROP_SIZE, CROP_SIZE)
  const rightImg = safeCrop(src, centerX + CROP_SIZE, centerY, CROP_SIZE, CROP_SIZE)
  const topImg = safeCrop(src, centerX, centerY - CROP_SIZE, CROP_SIZE, CROP_SIZE)
  const bottomImg = safeCrop(src, centerX, centerY + CROP_SIZE, CROP_SIZE, CROP_SIZE)

  const obj = {
    centerImg: matToBase64(centerImg),
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
export const processImages = async (queryImg: string, templateImg: string) => {
  // 1. 加载模板和目标图像
  const [src, template] = await Promise.all([base64ToMat(queryImg), base64ToMat(templateImg)])

  // 转为灰度图像
  cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY)
  cv.cvtColor(template, template, cv.COLOR_RGBA2GRAY)

  // 对图像进行二值化处理
  cv.threshold(src, src, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU)
  cv.threshold(template, template, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU)

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

    // TM_SQDIFF 126
    // TM_SQDIFF_NORMED 136
    // 4. 找到最佳匹配
    const minMax = cv.minMaxLoc(result, mask)
    const maxVal = minMax.maxVal
    const maxLoc = minMax.maxLoc

    // console.log('👻 ~ maxVal:', angle, maxVal.toFixed(4))
    // cv.imshow('canvasOutput', src)
    // cv.imshow('canvasOutput2', rotatedTemplate)

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
    angle: bestAngle,
    bestLocation,
    bestMatchVal
  }
}

export const detectMovement = async (currentImg: string, targetImg: string) => {
  const [curentMat, targetMat] = await Promise.all([
    base64ToMat(currentImg),
    base64ToMat(targetImg)
  ])

  // Convert to grayscale
  const grayCurrent = new cv.Mat()
  const grayPrevious = new cv.Mat()
  cv.cvtColor(curentMat, grayCurrent, cv.COLOR_BGR2GRAY)
  cv.cvtColor(targetMat, grayPrevious, cv.COLOR_BGR2GRAY)

  // Create ORB object
  const orb = new cv.ORB(5000, 1.2, 8, 15)

  // Detect ORB keypoints and descriptors
  const keypoints1 = new cv.KeyPointVector()
  const keypoints2 = new cv.KeyPointVector()
  const descriptors1 = new cv.Mat()
  const descriptors2 = new cv.Mat()
  orb.detectAndCompute(grayPrevious, new cv.Mat(), keypoints1, descriptors1)
  orb.detectAndCompute(grayCurrent, new cv.Mat(), keypoints2, descriptors2)

  // Check if descriptors are empty
  if (descriptors1.rows === 0 || descriptors2.rows === 0) {
    return { distance: 0, angle: 0, movement: new cv.Point(0, 0) }
  }

  // Use BFMatcher for feature matching
  const bf = new cv.BFMatcher(cv.NORM_HAMMING, false)
  const matches = new cv.DMatchVectorVector()
  bf.knnMatch(descriptors1, descriptors2, matches, 2)

  // Apply Lowe's ratio test
  const goodMatches: any[] = []
  for (let i = 0; i < matches.size(); i++) {
    const m = matches.get(i).get(0)
    const n = matches.get(i).get(1)
    if (m.distance < 0.75 * n.distance) {
      goodMatches.push(m)
    }
  }

  // If there are enough good matches, calculate displacement vector
  if (goodMatches.length > 5) {
    let movementX = 0
    let movementY = 0

    for (let i = 0; i < goodMatches.length; i++) {
      const pt1 = keypoints1.get(goodMatches[i].queryIdx).pt
      const pt2 = keypoints2.get(goodMatches[i].trainIdx).pt
      movementX += pt2.x - pt1.x
      movementY += pt2.y - pt1.y
    }

    movementX /= goodMatches.length
    movementY /= goodMatches.length

    // Calculate distance and angle
    const centerX = curentMat.cols / 2
    const centerY = curentMat.rows / 2
    const endX = centerX - movementX
    const endY = centerY - movementY

    const centerPoint = new cv.Point(centerX, centerY)
    const endPoint = new cv.Point(endX, endY)

    const distance = calculateDistance(centerPoint, endPoint)
    const angle = calculateAngle(centerPoint, endPoint)

    drawLine(curentMat, centerPoint, endPoint, new cv.Scalar(0, 0, 255, 255)) // 蓝色线

    cv.imshow('canvasOutput', curentMat)

    return { distance, angle, movement: new cv.Point(movementX, movementY) }
  } else {
    return { distance: 0, angle: 0, movement: new cv.Point(0, 0) }
  }
}

export const detectMovement2 = async (currentImg: string, targetImg: string) => {
  const [curentMat, targetMat] = await Promise.all([
    base64ToMat(currentImg),
    base64ToMat(targetImg)
  ])

  // Convert to grayscale
  const grayCurrent = new cv.Mat()
  const grayPrevious = new cv.Mat()
  cv.cvtColor(curentMat, grayCurrent, cv.COLOR_BGR2GRAY)
  cv.cvtColor(targetMat, grayPrevious, cv.COLOR_BGR2GRAY)
  // Create ORB object
  const orb = new cv.ORB(5000, 1.2, 8, 15)

  // Detect ORB keypoints and descriptors
  const keypoints1 = new cv.KeyPointVector()
  const keypoints2 = new cv.KeyPointVector()
  const descriptors1 = new cv.Mat()
  const descriptors2 = new cv.Mat()
  orb.detectAndCompute(grayPrevious, new cv.Mat(), keypoints1, descriptors1)
  orb.detectAndCompute(grayCurrent, new cv.Mat(), keypoints2, descriptors2)

  // Check if descriptors are empty
  if (descriptors1.rows === 0 || descriptors2.rows === 0) {
    return { distance: 0, angle: 0, movement: new cv.Point(0, 0) }
  }

  // Use BFMatcher for feature matching
  const bf = new cv.BFMatcher(cv.NORM_HAMMING, false)
  const matches = new cv.DMatchVectorVector()
  bf.knnMatch(descriptors1, descriptors2, matches, 2)

  // Apply Lowe's ratio test
  const goodMatches: any[] = []
  for (let i = 0; i < matches.size(); i++) {
    const m = matches.get(i).get(0)
    const n = matches.get(i).get(1)
    if (m.distance < 0.75 * n.distance) {
      goodMatches.push(m)
    }
  }

  // If there are enough good matches, calculate displacement vector
  if (goodMatches.length > 5) {
    const pts1: Point[] = []
    const pts2: Point[] = []
    for (let i = 0; i < goodMatches.length; i++) {
      pts1.push(keypoints1.get(goodMatches[i].queryIdx).pt)
      pts2.push(keypoints2.get(goodMatches[i].trainIdx).pt)
    }

    const pts1Mat = cv.matFromArray(
      pts1.length,
      1,
      cv.CV_32FC2,
      ([] as any[]).concat(...pts1.map((p) => [p.x, p.y]))
    )
    const pts2Mat = cv.matFromArray(
      pts2.length,
      1,
      cv.CV_32FC2,
      ([] as any[]).concat(...pts2.map((p) => [p.x, p.y]))
    )

    const mask = new cv.Mat()
    cv.findHomography(pts1Mat, pts2Mat, cv.RANSAC, 5.0, mask)
    const matchesMask = mask.data

    // Calculate movement only for inliers after RANSAC
    let movementX = 0
    let movementY = 0
    let inlierCount = 0
    for (let i = 0; i < matchesMask.length; i++) {
      if (matchesMask[i]) {
        movementX += pts2[i].x - pts1[i].x
        movementY += pts2[i].y - pts1[i].y
        inlierCount++
      }
    }

    if (inlierCount > 0) {
      movementX /= inlierCount
      movementY /= inlierCount

      // Calculate distance and angle
      const centerX = curentMat.cols / 2
      const centerY = curentMat.rows / 2
      const endX = centerX - movementX
      const endY = centerY - movementY

      const centerPoint = new cv.Point(centerX, centerY)
      const endPoint = new cv.Point(endX, endY)

      const distance = calculateDistance(centerPoint, endPoint)
      const angle = calculateAngle(centerPoint, endPoint)

      drawLine(curentMat, centerPoint, endPoint, new cv.Scalar(0, 0, 255, 255)) // 蓝色线

      cv.imshow('canvasOutput', curentMat)

      return { distance, angle, movement: new cv.Point(movementX, movementY) }
    } else {
      return { distance: 0, angle: 0, movement: new cv.Point(0, 0) }
    }
  } else {
    return { distance: 0, angle: 0, movement: new cv.Point(0, 0) }
  }
}

/** 计算父图中目标图片的位置 */
export const ImageInfoInParent = async (largeBase64: string, smallBase64: string) => {
  // 读取大图并转换为OpenCV矩阵
  // 加载小图并转换为OpenCV矩阵
  const [largeMat, smallMat] = await Promise.all([
    base64ToMat(largeBase64),
    base64ToMat(smallBase64)
  ])

  // 转为灰度图像
  cv.cvtColor(largeMat, largeMat, cv.COLOR_RGBA2GRAY)
  cv.cvtColor(smallMat, smallMat, cv.COLOR_RGBA2GRAY)

  // // 对图像进行二值化处理
  // cv.threshold(largeMat, largeMat, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU)
  // cv.threshold(smallMat, smallMat, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU)

  // 创建矩阵以存储匹配结果
  const result = new cv.Mat()
  const mask = new cv.Mat()

  // 对大图和小图进行模板匹配
  cv.matchTemplate(largeMat, smallMat, result, cv.TM_CCOEFF_NORMED, mask)

  // 获取匹配结果的最优位置
  const minMaxLocResult = cv.minMaxLoc(result, mask)
  const maxPoint = minMaxLocResult.maxLoc
  // 计算小图在大图上的中心点
  const targetPoint = calculateCenter(maxPoint, smallMat)

  // 获取匹配度（分数）
  const score = cv.minMaxLoc(result, mask).maxVal

  // Clean up
  largeMat.delete()
  smallMat.delete()
  result.delete()

  return {
    center: targetPoint,
    score: score === 1 ? 0 : score
  }
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

  // 对图像进行二值化处理
  // cv.threshold(dst, dst, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU)

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
