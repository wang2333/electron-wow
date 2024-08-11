import { useEffect, useRef, useState } from 'react'

import {
  base64ToMat,
  drawRoute,
  findImageInLargeImage,
  getImageFourFeature,
  getImagePosition,
  imageDataToBase64,
  imageToBase64,
  matToCanvas,
  processImages,
  recognize
} from './Util/imageControl'
import { Key } from './Util/Key'
import { grabRegion, pressKey, pressKeyDown, pressKeyLong, pressKeyUp } from './Util/mouseContril'

const sd = 2000 / 360
function App(): JSX.Element {
  const stopLoopRef = useRef(false)
  const pathIndexRef = useRef(0)

  // 保存图片计数
  const [imgNum, setImgNum] = useState(1)
  // 雷达起点
  const [startX, setStartX] = useState(1470)
  const [startY, setStartY] = useState(85)
  // 雷达尺寸
  const [width, setWidth] = useState(216)
  const [height, setHeight] = useState(216)
  // 测试图片名称
  const [imageName, setImageName] = useState('')
  // 测试日志
  const [log, setLog] = useState('')

  /** 报错日志信息 */
  const saveLog = (info: string) => {
    setLog(info)
    // const newLog = `${log}\n${info}`
    // const arr = newLog.split('\n')
    // if (arr.length > 300) {
    //   setLog(arr.slice(-300).join('\n'))
    // } else {
    //   setLog(newLog)
    // }
    const textarea = document.getElementById('textarea') as HTMLTextAreaElement
    textarea.scrollTop = textarea.scrollHeight
  }

  window.electron.ipcRenderer.removeAllListeners('shortcut-pressed')
  window.electron.ipcRenderer.on('shortcut-pressed', async (_, info) => {
    if (info === 'F1') {
      startLoop()
    } else if (info === 'F2') {
      stopLoop()
    }
  })

  useEffect(() => {
    return () => {
      stopLoopRef.current = true // Stop the loop on unmount
    }
  }, [])

  const save = async () => {
    const imageData = await grabRegion(startX, startY, width, height)
    const base64 = await imageDataToBase64(imageData, `./images/attack/${imgNum}.png`)

    setImageName(imgNum.toString())
    setImgNum(imgNum + 1)
    const mat = await base64ToMat(base64)
    matToCanvas(mat, 'canvasOutput')
    saveLog(`路径---${imgNum} 保存成功`)
  }

  // Function that will be called in the loop
  const loop = async () => {
    // 和箭头模板进行选择匹配
    const tempBase64 = await imageToBase64('./images/game/arrow.png')

    while (!stopLoopRef.current) {
      const curImageData = await grabRegion(startX, startY, width, height)
      const curBase64 = await imageDataToBase64(curImageData)

      // 当前位置特征
      const curPosition = await getImageFourFeature(curBase64)

      // 绘制当前雷达
      const mat = await base64ToMat(curBase64)
      matToCanvas(mat, 'canvasOutput')

      // await findMonster()

      if (pathIndexRef.current === 0) {
        await moveTarget('./images/attack/1.png', curPosition, tempBase64)
      } else if (pathIndexRef.current === 1) {
        await moveTarget('./images/attack/2.png', curPosition, tempBase64)
      } else if (pathIndexRef.current === 2) {
        await moveTarget('./images/attack/3.png', curPosition, tempBase64)
      } else {
        stopLoop()
      }
      // Add a delay if necessary
      await new Promise((resolve) => setTimeout(resolve, 50)) // 1000 ms delay
    }
  }

  const moveTarget = async (path: string, curPosition: any, tempBase64: string) => {
    const { bestAngle } = await processImages(curPosition.centerImg, tempBase64)
    // 绘制下个目标点
    const targetBase64 = await imageToBase64(path)
    const tarPosition = await getImageFourFeature(targetBase64)
    // 当前图片到目标图片的距离
    const { distance, angle } = await getImagePosition(targetBase64, curPosition, tarPosition)

    // 获取视角应该偏移的角度
    let diffAngle = 0
    let needAngle = 0
    if (angle < 0) {
      diffAngle = 360 + angle
      needAngle = bestAngle - diffAngle
    }
    if (angle > 0) {
      needAngle = (angle - bestAngle) * -1
    }

    if (needAngle < -180) {
      needAngle = needAngle + 360
    } else if (needAngle > 180) {
      needAngle = needAngle - 360
    }

    const time = Math.abs(needAngle) * sd

    if (distance > 1 && Math.abs(needAngle) > 5) {
      await pressKeyUp(Key.W)

      if (needAngle > 0) {
        await pressKeyLong(Key.D, time)
      } else {
        await pressKeyLong(Key.A, time)
      }
    }
    await pressKeyDown(Key.W)
    if (distance <= 1) {
      await pressKeyUp(Key.W)
      pathIndexRef.current = pathIndexRef.current + 1
    }

    saveLog(
      `人物角度：${bestAngle} 距目标点距离：${distance} 距目标点距角度${angle}/${diffAngle}/${needAngle}`
    )
  }

  const findMonster = async () => {
    // 判断是否找到怪物
    const curImageData = await grabRegion(50, 50, 1600, 780)
    const curBase64 = await imageDataToBase64(curImageData)

    // 获取怪物血条模板
    const tempBase64 = await imageToBase64('./images/game/blood.png')

    console.time()
    // const { center, score, distance, angle } =
    const { center, angle, score } = await findImageInLargeImage(curBase64, tempBase64, {
      x: 850,
      y: 800
    })
    console.timeEnd()

    // console.log('👻 ~ position:', center, score, distance, angle)
    saveLog(`怪物偏离角度：${angle}----${center.x}---${center.y}`)
    const time = Math.abs(angle) * sd

    if (Math.abs(angle) > 5) {
      if (angle > 0) {
        await pressKeyLong(Key.A, time)
      } else {
        await pressKeyLong(Key.D, time)
      }
    }

    // 判断与怪物的距离
  }

  const startLoop = () => {
    stopLoopRef.current = false
    loop() // Start the loop
  }

  const stopLoop = async () => {
    stopLoopRef.current = true
    pathIndexRef.current = 0
    setTimeout(async () => {
      await pressKeyUp(Key.W)
    }, 500)
  }

  const imageComparison = async () => {
    const res1 = await getImageFourFeature('./images/1.png') // 当前图片
    const res2 = await getImageFourFeature(`./images/${imageName}.png`) // 目标图片
    // 当前图片到目标图片的距离
    const { distance, angle, score } = await getImagePosition(
      `./images/${imageName}.png`,
      res1,
      res2
    )
    saveLog(`距离：${distance} 角度：${angle} 匹配得分：${score}`)
  }

  const imageMatch = async () => {
    // await findImageInLargeImage('./images/1.png', './images/0.png')
  }

  const process = async () => {
    // const tempBase64 = await imageToBase64('./images/game/arrow.png')
    // const { bestAngle, bestMatchVal } = await processImages(curBase64, tempBase64)
    // saveLog(` 角度：${bestAngle} 匹配得分：${bestMatchVal}`)
  }

  const getRoute = () => {
    drawRoute()
  }

  const getNum = async () => {
    const base64 = await imageToBase64('./images/12.png')
    const res = await recognize(base64)
    saveLog(`识别结果：${res}`)
  }

  const keyboard = async () => {
    await pressKey(Key.A)
  }
  const keyboard2 = async () => {
    await pressKeyLong(Key.A, 1000)
  }

  return (
    <div className={'panel'}>
      <div className={'coordinates'}>
        <div className="coordinates-item">
          <span>测试图片名称：</span>
          <input type="text" value={imageName} onChange={(e) => setImageName(e.target.value)} />
        </div>

        <div className={'coordinates-item'}>
          <span>雷达起点：</span>
          <input
            type="number"
            value={startX}
            placeholder={'Y坐标'}
            onChange={(e) => setStartX(+e.target.value)}
          />
          <input
            type="number"
            value={startY}
            placeholder={'Y坐标'}
            onChange={(e) => setStartY(+e.target.value)}
          />
        </div>
        <div className={'coordinates-item'}>
          <span>雷达尺寸：</span>
          <input
            type="number"
            value={width}
            placeholder={'宽度'}
            onChange={(e) => setWidth(+e.target.value)}
          />
          <input
            type="number"
            value={height}
            placeholder={'高度'}
            onChange={(e) => setHeight(+e.target.value)}
          />
        </div>
      </div>

      <div className="result">
        <span>输出结果：</span>
        <textarea value={log} rows={8} onChange={(e) => setLog(e.target.value)} id="textarea" />
      </div>

      <div
        style={{
          display: 'flex',
          padding: '20px',
          justifyContent: 'center',
          gap: '10px'
        }}
      >
        <button onClick={save}>保存路径</button>
        <button onClick={startLoop}>启动</button>
        <button onClick={stopLoop}>停止</button>
        <button onClick={imageMatch}>图片匹配</button>
        <button onClick={imageComparison}>对比图片</button>
        <button onClick={process}>旋转匹配</button>
        <button onClick={getRoute}>绘制路径</button>
        <button onClick={getNum}>文字识别</button>
        <button onClick={keyboard}>测试短按键</button>
        <button onClick={keyboard2}>测试长按键</button>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around'
        }}
      >
        <canvas id="canvasOutput"></canvas>
        <canvas id="canvasOutput2"></canvas>
      </div>
    </div>
  )
}

export default App
