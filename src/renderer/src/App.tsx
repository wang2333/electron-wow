import { useEffect, useRef, useState } from 'react'

import {
  base64ToMat,
  drawRoute,
  ImageInfoInParent,
  getImageFourFeature,
  getImagePosition,
  imageDataToBase64,
  imageToBase64,
  matToCanvas,
  processImages,
  recognize,
  calculateAngle
} from './Util/imageControl'
import { Key } from './Util/Key'
import {
  colorAt,
  findText,
  grabRegion,
  mouseLeftClick,
  pressKey,
  pressKeyDown,
  pressKeyLong,
  pressKeyUp
} from './Util/mouseContril'
import {
  ARROW_IMG_PATH,
  BLOOD_IMG_PATH,
  COLOR_DICT,
  DEGREES_PER_MILLISEOND,
  PERSON_POSITION
} from './constants'
import { Point } from '@nut-tree/nut-js'

interface IimgDict {
  /** 雷达任务箭头 */
  arrow: string
  /** 怪物血条 */
  blood: string
}

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

  // 录制路径类型
  const [pathType, setPathType] = useState('1')
  // 存放模板图片
  const [imgDict, setImgDict] = useState<IimgDict>({
    arrow: '',
    blood: ''
  })

  useEffect(() => {
    // 脚本初始化
    init()

    window.electron.ipcRenderer.removeAllListeners('shortcut-pressed')
    window.electron.ipcRenderer.on('shortcut-pressed', async (_, info) => {
      if (info === 'F1') {
        startLoop()
      } else if (info === 'F2') {
        stopLoop()
      }
    })
    return () => {
      window.electron.ipcRenderer.removeAllListeners('shortcut-pressed')
      stopLoopRef.current = true // Stop the loop on unmount
    }
  }, [])

  /** 报错日志信息 */
  const saveLog = (info: string) => {
    const textarea = document.getElementById('textarea') as HTMLTextAreaElement

    let newLog = `${textarea.value}\n${info}`
    const arr = newLog.split('\n')
    if (arr.length > 100) {
      newLog = arr.slice(-100).join('\n')
    }

    textarea.value = newLog
    textarea.scrollTop = textarea.scrollHeight
  }

  const init = async () => {
    // 读取任务箭头模板资源
    const arrowBase64 = await imageToBase64(ARROW_IMG_PATH)

    // 读取怪物血条模板资源
    const bloodBase64 = await imageToBase64(BLOOD_IMG_PATH)

    setImgDict({
      arrow: arrowBase64,
      blood: bloodBase64
    })
  }

  const save = async () => {
    const imageData = await grabRegion(startX, startY, width, height)
    const base64 = await imageDataToBase64(imageData, `./images/attack/${imgNum}.png`)

    setImageName(imgNum.toString())
    setImgNum(imgNum + 1)
    const mat = await base64ToMat(base64)
    matToCanvas(mat, 'canvasOutput')
    saveLog(`路径---${imgNum} 保存成功`)
  }

  // 脚本开始
  const startLoop = () => {
    stopLoopRef.current = false
    loop() // Start the loop
  }

  // 脚本结束
  const stopLoop = async () => {
    stopLoopRef.current = true
    pathIndexRef.current = 0
    setTimeout(async () => {
      await pressKeyUp(Key.W)
    }, 500)
  }

  // 在循环中调用的函数
  const loop = async () => {
    // 读取本地路径数据
    const paths = await window.api.readdir('images/attack')

    while (!stopLoopRef.current) {
      for (const item of paths) {
        // 寻找怪物坐标
        const monsterPosition = await isFindMonster()
        if (monsterPosition) {
          // 尝试攻击怪物
          await pressKey(Key.Q)
          const isAttact = await isPlayerAttact()
          if (isAttact) {
            // 在战斗中，停止移动
            await pressKeyUp(Key.W)
            // 开始战斗循环
            await pressKey(Key.Q)
          } else {
            // 不在战斗，向怪物移动
            await moveToMonster(monsterPosition)
          }
        } else {
          // 向下一坐标移动
          await moveToTarget(`./images/attack/${item}`)
        }
      }
      stopLoop()
      await new Promise((resolve) => setTimeout(resolve, 500)) // 1000 ms delay
    }
  }

  // 向目标点移动
  const moveToTarget = async (path: string) => {
    // 截取当前位置图片
    const curImageData = await grabRegion(startX, startY, width, height)
    // 读取当前点资源
    const curBase64 = await imageDataToBase64(curImageData)
    // 读取当前点特征
    const curPosition = await getImageFourFeature(curBase64)
    // 绘制当前雷达
    const mat = await base64ToMat(curBase64)
    matToCanvas(mat, 'canvasOutput')
    // 人物当前视角角度
    const { angle: personAngle } = await processImages(curPosition.centerImg, imgDict.arrow)
    // 读取目标点资源
    const targetBase64 = await imageToBase64(path)
    // 读取目标点特征
    const tarPosition = await getImageFourFeature(targetBase64)
    // 获取与目标点位的距离和角度
    const { distance, angle } = await getImagePosition(targetBase64, tarPosition, curPosition)

    // 计算人物视角应该偏移的角度
    let needAngle = 0
    if (angle < 0) {
      needAngle = personAngle - (360 + angle)
    } else if (angle > 0) {
      needAngle = (angle - personAngle) * -1
    }

    // 角度修正,计算最低旋转角度
    if (needAngle < -180) {
      needAngle = needAngle + 360
    } else if (needAngle > 180) {
      needAngle = needAngle - 360
    }

    if (distance > 1 && Math.abs(needAngle) > 5) {
      await pressKeyUp(Key.W)
      const time = Math.abs(needAngle) * DEGREES_PER_MILLISEOND
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

    saveLog(`人物修正角度：${needAngle} 距目标点距离：${distance} `)
  }

  // 向怪物移动
  const moveToMonster = async (point: Point) => {
    // 计算角度
    const needAngle = calculateAngle(PERSON_POSITION, point)

    if (Math.abs(needAngle) > 5) {
      await pressKeyUp(Key.W)
      const time = Math.abs(needAngle) * DEGREES_PER_MILLISEOND
      if (needAngle > 0) {
        await pressKeyLong(Key.D, time)
      } else {
        await pressKeyLong(Key.A, time)
      }
    }
    await pressKeyDown(Key.W)
  }

  // 是否找到怪物
  const isFindMonster = async () => {
    // 切换怪物
    await pressKey(Key.Tab)
    // 判断怪物是否选中
    const color = await colorAt({ x: COLOR_DICT.hasMonster[0], y: COLOR_DICT.hasMonster[1] })
    if (color === COLOR_DICT.hasMonster[2]) {
      // 获取人物视角范围
      const curImageData = await grabRegion(50, 50, 1600, 780)
      const curBase64 = await imageDataToBase64(curImageData)
      // 计算是否找到怪物
      const { center: targetPoint, score } = await ImageInfoInParent(curBase64, imgDict.blood)

      if (score > 0.8) {
        return targetPoint
      }
    }
    return false
  }

  // 是否战斗中
  const isPlayerAttact = async () => {
    const color = await colorAt({ x: COLOR_DICT.playerAttack[0], y: COLOR_DICT.playerAttack[1] })
    return color === COLOR_DICT.playerAttack[2]
  }

  const test = async () => {
    const imgs = await window.api.readdir('images/attack')
    console.log('👻 ~ imgs:', imgs)
    // await mouseLeftClick({ x: 0, Y: 0 })
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
        <textarea rows={8} id="textarea" />
      </div>

      <div
        style={{
          display: 'flex',
          padding: '20px',
          justifyContent: 'center',
          gap: '10px'
        }}
      >
        <button onClick={test}>测试API</button>
        <button onClick={startLoop}>启动</button>
        <button onClick={stopLoop}>停止</button>

        <select value={pathType} onChange={(e) => setPathType(e.target.value)}>
          <option value="1">打怪路径</option>
          <option value="2">维修路径</option>
          <option value="3">复活路径</option>
        </select>
        <button onClick={save}>保存路径</button>
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
