import { useEffect, useState } from 'react'

import {
  base64ToMat,
  drawRoute,
  findImageInLargeImage,
  getImageFourFeature,
  getImagePosition,
  imageToBase64,
  matToCanvas,
  processImages,
  recognize,
  saveImage
} from './Util/imageControl'
import { Key } from './Util/Key'
import { grabRegion, pressKey, pressKeyLong } from './Util/mouseContril'

function App(): JSX.Element {
  // 保存图片计数
  const [imgNum, setImgNum] = useState(1)

  // 雷达起点
  const [startX, setStartX] = useState(100)
  const [startY, setStartY] = useState(100)
  // 雷达尺寸
  const [width, setWidth] = useState(100)
  const [height, setHeight] = useState(100)
  // 测试图片名称
  const [imageName, setImageName] = useState('')
  // 测试日志
  const [log, setLog] = useState('')

  /** 报错日志信息 */
  const saveLog = (info: string) => {
    const newLog = `${log}\n${info}`
    const arr = newLog.split('\n')
    if (arr.length > 300) {
      setLog(arr.slice(-300).join('\n'))
    } else {
      setLog(newLog)
    }
    const textarea = document.getElementById('textarea') as HTMLTextAreaElement
    textarea.scrollTop = textarea.scrollHeight
  }

  useEffect(() => {
    window.electron.ipcRenderer.removeAllListeners('shortcut-pressed')
    window.electron.ipcRenderer.on('shortcut-pressed', async () => {
      await pressKeyLong(Key.A, 1000)
      // await pressKey(Key.A)
    })
  }, [])

  const save = async () => {
    const imageData = await grabRegion(startX, startY, width, height)
    const base64 = await saveImage(`./images/attack/${imgNum}.png`, imageData)
    setImageName(imgNum.toString())
    setImgNum(imgNum + 1)
    const mat = await base64ToMat(base64)
    matToCanvas(mat, 'canvasOutput')
    saveLog(`路径---${imgNum} 保存成功`)
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
    await findImageInLargeImage('./images/1.png', './images/0.png')
  }

  const process = async () => {
    const { bestAngle, bestMatchVal } = await processImages(
      './images/11.png',
      `./images/${imageName}.png`
    )
    saveLog(` 角度：${bestAngle} 匹配得分：${bestMatchVal}`)
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
        <button onClick={save}>启动</button>
        <button onClick={imageMatch}>图片匹配</button>
        <button onClick={imageComparison}>对比图片</button>
        <button onClick={process}>旋转匹配</button>
        <button onClick={getRoute}>绘制路径</button>
        <button onClick={getNum}>文字识别</button>
        <button onClick={keyboard}>测试短按键</button>
        <button onClick={keyboard2}>测试长按键</button>
      </div>

      <canvas id="canvasOutput"></canvas>
    </div>
  )
}

export default App
