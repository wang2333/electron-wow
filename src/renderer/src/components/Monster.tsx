import { useEffect, useRef, useState } from 'react'

import { Point } from '@nut-tree/nut-js'
import { ARROW_IMG_PATH, BLOOD_IMG_PATH, COLOR_DICT, PERSON_CENTER } from '../constants'
import {
  base64ToMat,
  calculateAngle,
  getImageFourFeature,
  getImagePosition,
  imageDataToBase64,
  ImageInfoInParent,
  imageToBase64,
  matToCanvas,
  processImages
} from '../Util/imageControl'
import { Key } from '../Util/Key'
import {
  clickInRect,
  colorAt,
  grabRegion,
  pressKey,
  pressKeyDown,
  pressKeyUp,
  sleep,
  turning
} from '../Util/mouseContril'

interface IimgTemplate {
  /** 雷达任务箭头 */
  arrow: string
  /** 怪物血条 */
  blood: string
}

/** 路径类型 */
type IPathType = 'monster' | 'maintenance' | 'revival'

function Monster(): JSX.Element {
  // 脚本循环开关
  const stopLoopRef = useRef(false)
  // 移动路径点标记
  const pathIndexRef = useRef(0)
  // 进入战斗标记
  const isAttactRef = useRef(false)
  // 人物是否在移动中
  const isMoveRef = useRef(false)
  // 找到怪物标记
  const isMoveMonsterRef = useRef(false)

  // 保存图片计数
  const [imgNum, setImgNum] = useState(0)
  // 雷达起点
  const [startX, setStartX] = useState(1470)
  const [startY, setStartY] = useState(85)
  // 雷达尺寸
  const [width, setWidth] = useState(216)
  const [height, setHeight] = useState(216)

  // 录制路径类型
  const [pathType, setPathType] = useState<IPathType>('monster')
  // 存放模板图片
  const [imgTemplate, setImgTemplate] = useState<IimgTemplate>({
    arrow: '',
    blood: ''
  })
  // 存放路径图片
  const [imgPaths, setImgPaths] = useState<Record<string, string>>({})

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

  /** 读取模板文件 */
  const init = async () => {
    const file = await window.api.readFile('./resources/config.json')
    const config = JSON.parse(file.toString())
    setStartX(config.radarX)
    setStartY(config.radarY)
    setWidth(config.radarWidth)
    setHeight(config.radarHeight)

    // 读取任务箭头模板资源
    const arrowBase64 = await imageToBase64(ARROW_IMG_PATH)
    // 读取怪物血条模板资源
    const bloodBase64 = await imageToBase64(BLOOD_IMG_PATH)

    setImgTemplate({
      arrow: arrowBase64,
      blood: bloodBase64
    })

    await checkCurrentPosition()
  }

  /** 保存路径点 */
  const save = async () => {
    const imageData = await grabRegion(startX, startY, width, height)
    const base64 = await imageDataToBase64(imageData, `./images/${pathType}-${imgNum}.png`)

    setImgNum(imgNum + 1)
    const mat = await base64ToMat(base64)
    matToCanvas(mat, 'canvasOutput')
    saveLog(`路径---${imgNum} 保存成功`)
  }

  /** 脚本开始 */
  const startLoop = async () => {
    saveLog(`脚本开始运行`)
    stopLoopRef.current = false
    loop() // Start the loop
  }

  /** 脚本结束 */
  const stopLoop = async () => {
    stopLoopRef.current = true
    pathIndexRef.current = 0

    await sleep(500)
    await playerStop()
    saveLog(`脚本结束运行`)
  }

  /** 重置 */
  const handleRest = () => {
    // 刷新页面
    window.location.reload()
  }

  /** 查找当前的路径类型和路径点 */
  const checkCurrentPosition = async () => {
    const curPosition = await getCurPosition()
    const attackPaths = await window.api.readdir('images')
    // 记录所有路径图片
    const imgNames = attackPaths.filter((v: string) => v.includes('.'))

    const result = {}
    const imgs = {}
    for await (const item of imgNames) {
      // 读取目标点资源
      const targetBase64 = await imageToBase64(`./images/${item}`)
      // 读取目标点特征
      const tarPosition = await getImageFourFeature(targetBase64)
      // 获取与目标点位的距离和角度
      const { distance, score } = await getImagePosition(targetBase64, tarPosition, curPosition)

      imgs[item] = targetBase64
      result[item] = { distance, score }
    }

    // 从result中找到score不为0且distance最小的数据
    const bsetImg = Object.keys(result).reduce((a: any, b: any) => {
      if (result[a].score !== 0 && result[b].distance > result[a].distance) {
        return a
      }
      return b
    })

    const imgType = bsetImg.split('-')
    // const step = +imgType[1].split('.')[0]
    // pathIndexRef.current = step

    setImgPaths(imgs)
    setPathType(imgType[0] as IPathType)
  }

  /** 无限循环执行脚本 */
  const loop = async () => {
    while (!stopLoopRef.current) {
      // 判断是否在战斗中
      const isAttact = await isPlayerAttact()
      if (isAttact) {
        isMoveMonsterRef.current = false
        isAttactRef.current = true
        // 在战斗中，停止移动
        await playerStop()
        // 开始战斗循环
        await pressKey(Key.Q)

        saveLog(`人物战斗中`)
        continue
      }

      // 战斗结束时，取消选中怪物标记并进行拾取
      if (isAttactRef.current) {
        isAttactRef.current = false
        isMoveMonsterRef.current = false
        await clickInRect(570, 570, 530, 300, 50, 50)
      }

      const monsterPosition = await isFindMonster()
      // 没有选中怪物时，寻找怪物
      if (monsterPosition) {
        isMoveMonsterRef.current = true
        saveLog(`找到怪物，向怪物移动`)
      }

      if (monsterPosition && typeof monsterPosition !== 'boolean') {
        // 向怪物移动
        await moveToMonster(monsterPosition)
        // 尝试攻击怪物
        await pressKey(Key.Q)
        saveLog(`尝试向怪物发起攻击`)
        continue
      }

      // 判断当前所在路径
      const currentPathPoint = Object.keys(imgPaths).filter((v) => v.includes(pathType))

      if (pathIndexRef.current < currentPathPoint.length) {
        // 向下一坐标移动
        await moveToTarget(pathIndexRef.current)
      } else {
        // stopLoop()
        pathIndexRef.current = 0
      }

      // await sleep(500)
    }
  }

  /** 向目标路径点移动 */
  const moveToTarget = async (target: number) => {
    // 读取目标点资源
    const targetBase64 = imgPaths[`${pathType}-${target}.png`]
    const [curPosition, tarPosition] = await Promise.all([
      // 当前雷达信息
      getCurPosition(),
      // 读取目标点特征
      getImageFourFeature(targetBase64)
    ])

    const [{ distance, angle }, { angle: personAngle }] = await Promise.all([
      // 获取与目标点位的距离和角度
      getImagePosition(targetBase64, tarPosition, curPosition),
      // 人物当前视角角度
      processImages(curPosition.centerImg, imgTemplate.arrow)
    ])

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

    // 调整视角
    needAngle = +needAngle.toFixed(2)

    if (Math.abs(needAngle) > 10) {
      await playerStop()
      await turning(-needAngle)
    }
    await playerForward()
    // 到达目标点位后，停止移动
    if (distance < 1.5) {
      await playerStop()
      pathIndexRef.current = pathIndexRef.current + 1
    }

    saveLog(
      `向路径点--${pathIndexRef.current}移动 修正视角：${needAngle} 距目标点距离：${distance} `
    )
  }

  /** 获取当前雷达图特征 */
  const getCurPosition = async () => {
    // 截取当前位置图片
    const curImageData = await grabRegion(startX, startY, width, height)
    // 读取当前点资源
    const curBase64 = await imageDataToBase64(curImageData)
    // 读取当前点特征
    const curPosition = await getImageFourFeature(curBase64)
    // 绘制当前雷达
    const mat = await base64ToMat(curBase64)
    matToCanvas(mat, 'canvasOutput')
    return curPosition
  }

  /** 是否找到怪物 */
  const isFindMonster = async () => {
    // 切换怪物
    if (!isMoveMonsterRef.current) {
      await pressKey(Key.Tab)
    }
    // 判断怪物是否选中
    const color = await colorAt({ x: COLOR_DICT.hasMonster[0], y: COLOR_DICT.hasMonster[1] })
    if (color.includes(COLOR_DICT.hasMonster[2])) {
      // 获取人物视角范围
      const curImageData = await grabRegion(50, 50, 1600, 780)
      const curBase64 = await imageDataToBase64(curImageData)
      // 计算是否找到怪物
      const { center: targetPoint, score } = await ImageInfoInParent(curBase64, imgTemplate.blood)
      if (score > 0.8) {
        return targetPoint
      }
    }
    return false
  }

  /** 向怪物移动 */
  const moveToMonster = async (point: Point) => {
    // 计算角度
    const needAngle = calculateAngle(PERSON_CENTER, point)

    if (Math.abs(needAngle) > 10) {
      await playerStop()
      await turning(needAngle)
    }
    await playerForward()
  }

  /** 人物是否战斗中 */
  const isPlayerAttact = async () => {
    const color = await colorAt({ x: COLOR_DICT.playerAttack[0], y: COLOR_DICT.playerAttack[1] })
    const color2 = await colorAt({ x: COLOR_DICT.monsteAttack[0], y: COLOR_DICT.monsteAttack[1] })
    return (
      !color.includes(COLOR_DICT.playerAttack[2]) && color2.includes(COLOR_DICT.monsteAttack[2])
    )
  }

  /** 人物前进 */
  const playerForward = async () => {
    if (!isMoveRef.current) {
      await pressKeyDown(Key.W)
      isMoveRef.current = true
    }
  }

  /** 人物停止 */
  const playerStop = async () => {
    if (isMoveRef.current) {
      await pressKeyUp(Key.W)
      isMoveRef.current = false
    }
  }

  const test = async () => {
    // await clickInRect(1000, 250, 500, 100, 100, 100)
    // await clickInSpiral(700, 300, 200, 50, 10)
    // await clickInCircle(700, 300, 200, 10)
    // await turning(90)
    // await sleep(1000)
    // await turning(-90)
    await clickInRect(570, 570, 530, 300, 50, 50)
  }

  return (
    <div className={'monster'}>
      <div className={'coordinates'}>
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

      <div
        style={{
          display: 'flex',
          padding: '10px',
          justifyContent: 'center',
          gap: '10px'
        }}
      >
        <button onClick={test}>测试API</button>
        <button onClick={startLoop}>启动</button>
        <button onClick={stopLoop}>停止</button>
        <button onClick={handleRest}>重置</button>

        <select value={pathType} onChange={(e) => setPathType(e.target.value as IPathType)}>
          <option value="monster">打怪路径</option>
          <option value="maintenance">维修路径</option>
          <option value="revival">复活路径</option>
        </select>
        <button onClick={save}>保存路径</button>
      </div>

      <div className="result">
        <span>输出结果：</span>
        <textarea rows={8} id="textarea" />
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          marginTop: '20px'
        }}
      >
        <canvas id="canvasOutput"></canvas>
        <canvas id="canvasOutput2"></canvas>
      </div>
    </div>
  )
}

export default Monster
