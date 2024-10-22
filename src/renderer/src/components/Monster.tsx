import React, { useEffect, useRef, useState, useCallback } from 'react'

import { ARROW_IMG_PATH, BLOOD_IMG_PATH, DEGREES_PER_MILLISEOND } from '../constants'
import {
  base64ToMat,
  getImageFourFeature,
  getImagePosition,
  imageDataToBase64,
  imageToBase64,
  leidaPaddingX,
  leidaPaddingY,
  leidaPointerHeight,
  leidaPointerWidth,
  leidaPointerX,
  leidaPointerY,
  matToCanvas,
  processImages
} from '../Util/imageControl'
import { Key } from '../Util/Key'
import { grabRegion, pressKeyDown, pressKeyLong, pressKeyUp, sleep } from '../Util/mouseContril'

interface IimgTemplate {
  arrow: string
  blood: string
}

type IPathType = 'monster' | 'maintenance' | 'revival'

const containerStyle: React.CSSProperties = {
  color: '#333',
  backgroundColor: '#f0f0f0',
  borderRadius: '8px',
  padding: '20px',
  maxWidth: '800px',
  margin: '20px auto',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
}

const sectionStyle: React.CSSProperties = {
  marginBottom: '20px'
}

const inputGroupStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  marginBottom: '10px'
}

const labelStyle: React.CSSProperties = {
  width: '120px',
  fontWeight: 'bold'
}

const inputStyle: React.CSSProperties = {
  width: '80px',
  padding: '5px',
  marginRight: '10px',
  border: '1px solid #ccc',
  borderRadius: '4px'
}

const buttonStyle: React.CSSProperties = {
  padding: '8px 16px',
  margin: '0 5px',
  backgroundColor: '#4CAF50',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer'
}

const selectStyle: React.CSSProperties = {
  padding: '5px',
  marginRight: '10px',
  border: '1px solid #ccc',
  borderRadius: '4px'
}

const textareaStyle: React.CSSProperties = {
  width: '100%',
  height: '150px',
  padding: '10px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  resize: 'vertical'
}

function Monster(): JSX.Element {
  const stopLoopRef = useRef(false)
  const pathIndexRef = useRef(0)
  const isMoveRef = useRef(false)

  const [imgNum, setImgNum] = useState(0)
  const [pathType, setPathType] = useState<IPathType>('monster')
  const [imgTemplate, setImgTemplate] = useState<IimgTemplate>({ arrow: '', blood: '' })
  const [imgPaths, setImgPaths] = useState<Record<string, string>>({})

  const saveLog = useCallback((info: string) => {
    const textarea = document.getElementById('textarea') as HTMLTextAreaElement
    let newLog = `${textarea.value}\n${info}`
    const arr = newLog.split('\n')
    if (arr.length > 100) {
      newLog = arr.slice(-100).join('\n')
    }
    textarea.value = newLog
    textarea.scrollTop = textarea.scrollHeight
  }, [])

  const init = useCallback(async () => {
    const [arrowBase64, bloodBase64] = await Promise.all([
      imageToBase64(ARROW_IMG_PATH),
      imageToBase64(BLOOD_IMG_PATH)
    ])

    setImgTemplate({ arrow: arrowBase64, blood: bloodBase64 })
    await checkCurrentPosition()
  }, [])

  useEffect(() => {
    init()

    const handleShortcut = async (_, info: string) => {
      if (info === 'F1') startLoop()
      else if (info === 'F2') stopLoop()
    }

    window.electron.ipcRenderer.on('shortcut-pressed', handleShortcut)
    return () => {
      window.electron.ipcRenderer.removeAllListeners('shortcut-pressed')
      stopLoopRef.current = true
    }
  }, [init])

  const save = async () => {
    const imageData = await grabRegion(
      leidaPointerX - leidaPaddingX,
      leidaPointerY - leidaPaddingY,
      2 * leidaPaddingX + leidaPointerWidth,
      2 * leidaPaddingY + leidaPointerHeight
    )
    const base64 = await imageDataToBase64(imageData, `./images/${pathType}-${imgNum}.png`)

    setImgNum((prev) => prev + 1)
    const mat = await base64ToMat(base64)
    matToCanvas(mat, 'canvasOutput')
    saveLog(`路径---${imgNum} 保存成功`)
  }

  const startLoop = async () => {
    saveLog(`脚本开始运行`)
    stopLoopRef.current = false
    await sleep(2000)
    loop()
  }

  const stopLoop = async () => {
    stopLoopRef.current = true
    pathIndexRef.current = 0
    await sleep(2000)
    await playerStop()
    saveLog(`脚本结束运行`)
  }

  const handleReset = () => {
    window.location.reload()
  }

  const checkCurrentPosition = async () => {
    const attackPaths = await window.api.readdir('images')
    const imgNames = attackPaths.filter((v: string) => v.includes('.'))

    const imgs = {}
    for await (const item of imgNames) {
      const targetBase64 = await imageToBase64(`./images/${item}`)
      imgs[item] = targetBase64
    }

    setImgPaths(imgs)
  }

  const loop = async () => {
    const currentPathPoint = Object.keys(imgPaths).filter((v) => v.includes(pathType))

    while (!stopLoopRef.current) {
      if (pathIndexRef.current < currentPathPoint.length) {
        await moveToTarget(pathIndexRef.current)
      } else {
        stopLoop()
      }
      await sleep(300)
    }
  }

  const moveToTarget = async (target: number) => {
    const targetBase64 = imgPaths[`${pathType}-${target}.png`]
    const [curPosition, tarPosition] = await Promise.all([
      getCurPosition(),
      getImageFourFeature(targetBase64)
    ])
    const [{ distance, angle }, { angle: personAngle }] = await Promise.all([
      getImagePosition(targetBase64, tarPosition, curPosition),
      processImages(curPosition.centerImg, imgTemplate.arrow)
    ])

    let needAngle = angle < 0 ? personAngle - (360 + angle) : (angle - personAngle) * -1

    if (needAngle <= -180) needAngle += 360
    else if (needAngle >= 180) needAngle -= 360

    if (Math.abs(needAngle) > 5 && Math.abs(needAngle) < 60) {
      await playerStop()
      await pressKeyLong(
        needAngle < 0 ? Key.A : Key.D,
        Math.abs(needAngle) * DEGREES_PER_MILLISEOND
      )
    }
    await playerForward()

    if (distance < 1.5) {
      await playerStop()
      pathIndexRef.current++
    }

    saveLog(
      `向路径点--${pathIndexRef.current}移动 修正视角：${needAngle} 距目标点距离：${distance} `
    )
  }

  const getCurPosition = async () => {
    const curImageData = await grabRegion(
      leidaPointerX - leidaPaddingX,
      leidaPointerY - leidaPaddingY,
      2 * leidaPaddingX + leidaPointerWidth,
      2 * leidaPaddingY + leidaPointerHeight
    )
    const curBase64 = await imageDataToBase64(curImageData)
    const curPosition = await getImageFourFeature(curBase64)
    const mat = await base64ToMat(curBase64)
    matToCanvas(mat, 'canvasOutput')
    return curPosition
  }

  const playerForward = async () => {
    if (!isMoveRef.current) {
      await pressKeyDown(Key.W)
      isMoveRef.current = true
    }
  }

  const playerStop = async () => {
    if (isMoveRef.current) {
      await pressKeyUp(Key.W)
      isMoveRef.current = false
    }
  }

  const test = async () => {
    const curBase64 = await getCurPosition()
    const r = await processImages(curBase64.centerImg, imgTemplate.arrow)
    console.log('👻 ~ r:', r)
  }

  return (
    <div style={containerStyle}>
      <div style={sectionStyle}>
        <div style={inputGroupStyle}>
          <span style={labelStyle}>雷达起点：</span>
          <input
            style={inputStyle}
            type="number"
            value={leidaPointerX}
            placeholder="X坐标"
            readOnly
          />
          <input
            style={inputStyle}
            type="number"
            value={leidaPointerY}
            placeholder="Y坐标"
            readOnly
          />
        </div>
        <div style={inputGroupStyle}>
          <span style={labelStyle}>雷达尺寸：</span>
          <input
            style={inputStyle}
            type="number"
            value={leidaPointerWidth}
            placeholder="宽度"
            readOnly
          />
          <input
            style={inputStyle}
            type="number"
            value={leidaPointerHeight}
            placeholder="高度"
            readOnly
          />
        </div>
      </div>

      <div style={{ ...sectionStyle, display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button style={buttonStyle} onClick={test}>
          测试API
        </button>
        <button style={buttonStyle} onClick={startLoop}>
          启动
        </button>
        <button style={buttonStyle} onClick={stopLoop}>
          停止
        </button>
        <button style={buttonStyle} onClick={handleReset}>
          重置
        </button>

        <select
          style={selectStyle}
          value={pathType}
          onChange={(e) => setPathType(e.target.value as IPathType)}
        >
          <option value="monster">打怪路径</option>
          <option value="maintenance">维修路径</option>
          <option value="revival">复活路径</option>
        </select>
        <button style={buttonStyle} onClick={save}>
          保存路径
        </button>
      </div>

      <div style={sectionStyle}>
        <span style={labelStyle}>输出结果：</span>
        <textarea style={textareaStyle} rows={8} id="textarea" />
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
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
