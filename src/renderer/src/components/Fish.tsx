import { useEffect, useRef, useState } from 'react'

import { Key } from '@renderer/Util/Key'
import { colorAt, mouseInfo, mouseLeftClick, pressKey, sleep } from '@renderer/Util/mouseContril'

const Fish: React.FC = () => {
  const [key1, setKey1] = useState('J')
  const [key2, setKey2] = useState('Q')

  const [config, setConfig] = useState<any>({})

  // 脚本循环开关
  const stopLoopRef = useRef(false)
  // 标记是否已经甩杆
  const isStartRef = useRef(false)
  const startTimeRef = useRef(0)
  const checkNumRef = useRef(0)

  useEffect(() => {
    init()

    window.electron.ipcRenderer.removeAllListeners('shortcut-pressed')
    window.electron.ipcRenderer.on('shortcut-pressed', async (_, info) => {
      if (info === 'F1') {
        getColor()
      }
    })
    return () => {
      window.electron.ipcRenderer.removeAllListeners('shortcut-pressed')
      stopLoopRef.current = true // Stop the loop on unmount
    }
  }, [])

  const init = async () => {
    const file = await window.api.readFile('./resources/config.json')
    const config = JSON.parse(file.toString())
    setConfig(config)
  }

  /** 脚本开始 */
  const startLoop = async () => {
    await mouseLeftClick({
      x: config.processX,
      y: config.processY
    })

    stopLoopRef.current = false
    loop()
  }

  /** 脚本结束 */
  const stopLoop = async () => {
    stopLoopRef.current = true
  }

  /** 重置 */
  const handleRest = () => {
    // 刷新页面
    window.location.reload()
  }

  const getColor = async () => {
    const { color, position } = await mouseInfo()
    saveLog(`当前位置颜色：${color}, 位置：${position.x}/${position.y}`)
  }

  /** 无限循环执行脚本 */
  const loop = async () => {
    while (!stopLoopRef.current) {
      // 小退时处理
      const loginOutFlag = await isLoginOut()
      if (loginOutFlag) {
        isStartRef.current = false
        await mouseLeftClick({
          x: config.processX,
          y: config.processY
        })
        await pressKey(Key.Enter)
        await sleep(10000)
        continue
      }

      // 没有开始钓鱼，或者没鱼上钩
      if (!isStartRef.current || new Date().getTime() - startTimeRef.current > 17 * 1000) {
        saveLog(`准备开始钓鱼`)

        // 添加随机行为
        if (Math.random() > 0.95) {
          await mouseLeftClick({
            x: config.processX,
            y: config.processY
          })
          await pressKey(Key.Space)
          saveLog(`执行了随机行为`)
          await sleep(1000)
        }

        await pressKey(Key[key2])
        await sleep(500)
        // 判断是否开始钓鱼
        const startFlag = await isStartFish()
        if (startFlag) {
          saveLog(`已经开始钓鱼`)
          isStartRef.current = true
          startTimeRef.current = new Date().getTime()
        }
      }

      // 开始钓鱼，监测鱼上钩动作
      if (isStartRef.current) {
        const color = await colorAt({ x: config.micX, y: config.micY })
        saveLog(`正在钓鱼---${color}`)

        if (color !== config.micColor) {
          checkNumRef.current = checkNumRef.current + 1
        }
        if (checkNumRef.current >= 2) {
          await sleep(200)
          await pressKey(Key[key1])
          await sleep(2000)
          isStartRef.current = false
          checkNumRef.current = 0
        }
      }

      await sleep(100)
    }
  }

  const isStartFish = async () => {
    const color = await colorAt({ x: config.processX, y: config.processY })
    saveLog(`检测是否正在钓鱼---${config.processColor}/${color}`)
    return color === config.processColor
  }
  const isLoginOut = async () => {
    const color = await colorAt({ x: config.loginOutX, y: config.loginOutY })
    saveLog(`检测是否在小退界面---${config.loginOutColor}/${color}`)
    return color === config.loginOutColo
  }

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

  return (
    <div className={'fish'}>
      <div className="config">
        <div className="item">
          <span>收杆：</span>
          <input value={key1} placeholder={'收杆'} onChange={(e) => setKey1(e.target.value)} />
        </div>
        <div className="item">
          <span>甩杆：</span>
          <input value={key2} placeholder={'甩杆'} onChange={(e) => setKey2(e.target.value)} />
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
        <button onClick={startLoop}>启动</button>
        <button onClick={stopLoop}>停止</button>
        <button onClick={handleRest}>重置</button>
        <button onClick={getColor}>取色</button>
      </div>

      <div
        className="result"
        style={{
          display: 'flex',
          padding: '10px',
          justifyContent: 'center',
          gap: '10px'
        }}
      >
        <span>输出结果：</span>
        <textarea
          rows={8}
          id="textarea"
          style={{
            flex: 1
          }}
        />
      </div>
    </div>
  )
}

export default Fish
