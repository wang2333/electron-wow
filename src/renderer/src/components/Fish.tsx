import { useEffect, useRef, useState } from 'react'

import { Key } from '@renderer/Util/Key'
import {
  colorAt,
  mouseInfo,
  mouseLeftClick,
  pressKey,
  pressKeys,
  sleep
} from '@renderer/Util/mouseContril'

const Fish: React.FC = () => {
  const [key1, setKey1] = useState('J')
  const [key2, setKey2] = useState('Q')
  const [key3, setKey3] = useState('E')
  const [key4, setKey4] = useState('2')
  const [key5, setKey5] = useState('2')

  const [config, setConfig] = useState<any>({})

  // 脚本循环开关
  const stopLoopRef = useRef(false)
  // 标记是否已经甩杆
  const isStartRef = useRef(false)
  const startTimeRef = useRef(0)
  const checkNumRef = useRef(0)

  useEffect(() => {
    init('win10-1K')

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

  const init = async (fileName: string) => {
    const file = await window.api.readFile(`./resources/${fileName}.json`)
    const config = JSON.parse(file.toString())
    setConfig(config)
  }

  const handleSystemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    init(value)
  }

  /** 脚本开始 */
  const startLoop = async () => {
    stopLoopRef.current = false
    await sleep(2000)
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
      if (key5 === '1') {
        const isNeedOut =
          [2, 5, 8, 11, 14, 17, 20, 23].includes(new Date().getHours()) &&
          new Date().getMinutes() >= 58
        if (isNeedOut) {
          await pressKeys(Key.R)
          await sleep(5 * 60 * 1000)
        }
      }

      // 监测是否在重新连接界面
      const reconnectFlag = await isReconnect()
      if (reconnectFlag) {
        feedBack('游戏掉线咯！！')
        isStartRef.current = false
        await sleep(30000)
        await mouseLeftClick({
          x: config.logeX,
          y: config.logeY
        })
        await sleep(2000)
        // 确认掉线
        await pressKey(Key.Enter)
        await sleep(2000)
        // 重新连接确认
        await pressKey(Key.Enter)
        await sleep(10000)
        // 选择频道
        await mouseLeftClick({
          x: config.channelX,
          y: config.channelY
        })
        await sleep(2000)
        await pressKey(Key.Enter)
        await sleep(10000)
        continue
      }

      // 监测是否在小退界面
      const roleFlag = await isRole()
      if (roleFlag) {
        isStartRef.current = false
        await sleep(10000)
        // 选择角色
        await mouseLeftClick({
          x: config.roleNameX,
          y: config.roleNameY + (+key4 - 1) * 40
        })
        await sleep(2000)
        await pressKey(Key.Enter)
        await sleep(10000)

        const isFail = await isRole()
        feedBack(isFail ? '游戏重连失败' : '游戏重连成功')
        if (isFail) {
          // 关闭游戏
          await pressKeys(Key.LeftAlt, Key.F4)
          stopLoop()
        }
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

      // 检测鱼饵
      if (key3) {
        const baitFlag = await isBait()
        if (!baitFlag) {
          await pressKey(Key[key3])
          await sleep(5000)
          isStartRef.current = false
        }
      }

      await sleep(100)
    }
  }

  /** 发送消息 */
  const feedBack = (msg: string) => {
    const miao_code = 'tbrzT88'

    fetch(`http://miaotixing.com/trigger?id=${miao_code}&text=${msg}&type=jsonp`, {
      method: 'GET',
      mode: 'cors',
      credentials: 'same-origin'
    })
  }

  // 检测是否正在钓鱼
  const isStartFish = async () => {
    const color = await colorAt({ x: config.processX, y: config.processY })
    saveLog(`检测是否正在钓鱼---${color}/标准色值：${config.processColor}`)
    return color == config.processColor
  }

  // 检测是否在重新连接界面
  const isReconnect = async () => {
    const color = await colorAt({ x: config.reconnectX, y: config.reconnectY })
    if (color === config.reconnectColor) {
      saveLog(`重新连接界面---${color}/标准色值：${config.reconnectColor}`)
    }
    return color == config.reconnectColor
  }

  // 检测是否在角色界面
  const isRole = async () => {
    const color = await colorAt({ x: config.logeX, y: config.logeY })
    if (color === config.logeColor) {
      saveLog(`角色界面---${color}/标准色值：${config.logeColor}`)
    }
    return color == config.logeColor
  }

  // 检测是否有鱼饵
  const isBait = async () => {
    const color = await colorAt({ x: config.baitX, y: config.baitY })
    if (!config.baitColor.includes(color)) {
      saveLog(`没有鱼饵---${color}/标准色值：${config.baitColor}`)
      console.log('color :>> ', color)
    }
    return config.baitColor.includes(color)
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
        <div className="item">
          <span>鱼饵：</span>
          <input value={key3} placeholder={'鱼饵：'} onChange={(e) => setKey3(e.target.value)} />
        </div>
        <div className="item">
          <span>角色：</span>
          <select value={key4} onChange={(e) => setKey4(e.target.value)}>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
        </div>
        <div className="item">
          <span>电脑系统：</span>
          <select onChange={handleSystemChange}>
            <option value="win10-1K">win10-1K</option>
            <option value="win11-1K">win11-1K</option>
            <option value="win11-2K">win11-2K</option>
          </select>
        </div>
        <div className="item">
          <span>冬拥湖小退：</span>
          <select value={key5} onChange={(e) => setKey5(e.target.value)}>
            <option value="1">开启</option>
            <option value="0">关闭</option>
          </select>
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
