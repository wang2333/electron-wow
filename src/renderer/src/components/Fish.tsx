import React, { useEffect, useRef, useState } from 'react'
import { Key } from '@renderer/Util/Key'
import {
  colorAt,
  mouseInfo,
  mouseLeftClick,
  pressKey,
  pressKeys,
  sleep
} from '@renderer/Util/mouseContril'
import { fishStyles as styles } from '@renderer/styles/fish'
import { theme } from '@renderer/styles/theme'

interface FishConfig {
  [key: string]: any
}

interface FishKeys {
  key1: string
  key2: string
  key3: string
  key4: string
  key5: string
}

const FEEDBACK_CODE = 'tbrzT88'
const CHECK_INTERVAL = 100 // ms
const RECONNECT_WAIT_TIME = 30000 // ms
const ROLE_SELECT_INTERVAL = 40 // px

const Fish: React.FC = () => {
  const [keys, setKeys] = useState<FishKeys>({
    key1: 'J',
    key2: 'Q',
    key3: 'E',
    key4: '3',
    key5: '0'
  })
  const [config, setConfig] = useState<FishConfig>({})
  const [isRunning, setIsRunning] = useState(false)

  const stopLoopRef = useRef(false)
  const isStartRef = useRef(false)
  const startTimeRef = useRef(0)
  const checkNumRef = useRef(0)

  useEffect(() => {
    init('win11-1K')
    const listener = (_, info) => info === 'F1' && getColor()
    window.electron.ipcRenderer.on('shortcut-pressed', listener)
    return () => {
      window.electron.ipcRenderer.removeListener('shortcut-pressed', listener)
      stopLoopRef.current = true
    }
  }, [])

  const init = async (fileName: string) => {
    const file = await window.api.readFile(`./resources/${fileName}.json`)
    setConfig(JSON.parse(file.toString()))
  }

  const handleSystemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    init(e.target.value)
  }

  const startLoop = async () => {
    stopLoopRef.current = false
    setIsRunning(true)
    await sleep(2000)
    loop()
  }

  const stopLoop = () => {
    stopLoopRef.current = true
    setIsRunning(false)
  }

  const handleReset = () => {
    window.location.reload()
  }

  const getColor = async () => {
    const { color, position } = await mouseInfo()
    saveLog(`当前位置颜色：${color}, 位置：${position.x}/${position.y}`)
  }

  const loop = async () => {
    while (!stopLoopRef.current) {
      await handleWinterLakeLogout()
      await handleReconnect()
      await handleRoleSelection()
      await handleFishing()
      await checkBait()
      await sleep(CHECK_INTERVAL)
    }
  }
  /** 冬拥湖小退 */
  const handleWinterLakeLogout = async () => {
    if (keys.key5 === '1') {
      const currentHour = new Date().getHours()
      const currentMinute = new Date().getMinutes()
      const isNeedOut = [2, 5, 8, 11, 14, 17, 20, 23].includes(currentHour) && currentMinute >= 58
      if (isNeedOut) {
        await pressKeys(Key.R)
        await sleep(5 * 60 * 1000)
      }
    }
  }

  /** 游戏掉线 */
  const handleReconnect = async () => {
    if (await isReconnect()) {
      feedBack('游戏掉线咯！！')
      isStartRef.current = false
      await sleep(RECONNECT_WAIT_TIME)
      await mouseLeftClick({ x: config.logeX, y: config.logeY })
      await sleep(2000)
      await pressKey(Key.Enter)
      await sleep(2000)
      await pressKey(Key.Enter)
      await sleep(10000)
      await mouseLeftClick({ x: config.channelX, y: config.channelY })
      await sleep(2000)
      await pressKey(Key.Enter)
      await sleep(10000)
    }
  }

  /** 角色选择 */
  const handleRoleSelection = async () => {
    if (await isRole()) {
      isStartRef.current = false
      await sleep(10000)
      await mouseLeftClick({
        x: config.roleNameX,
        y: config.roleNameY + (Number(keys.key4) - 1) * ROLE_SELECT_INTERVAL
      })
      await sleep(2000)
      await pressKey(Key.Enter)
      await sleep(10000)

      const isFail = await isRole()
      feedBack(isFail ? '游戏重连失败' : '游戏重连成功')
      if (isFail) {
        await pressKeys(Key.LeftAlt, Key.F4)
        stopLoop()
      }
    }
  }

  /** 钓鱼 */
  const handleFishing = async () => {
    if (!isStartRef.current || new Date().getTime() - startTimeRef.current > 17 * 1000) {
      saveLog(`准备开始钓鱼`)
      if (Math.random() > 0.95) {
        await mouseLeftClick({ x: config.processX, y: config.processY })
        await pressKey(Key.Space)
        await sleep(1000)
      }
      await pressKey(Key[keys.key2])
      await sleep(500)
      if (await isStartFish()) {
        saveLog(`已经开始钓鱼`)
        isStartRef.current = true
        startTimeRef.current = new Date().getTime()
      }
    }

    if (isStartRef.current) {
      const color = await colorAt({ x: config.micX, y: config.micY })
      saveLog(`正在钓鱼---${color}`)
      if (color !== config.micColor) {
        checkNumRef.current++
      }
      if (checkNumRef.current >= 2) {
        await sleep(200)
        await pressKey(Key[keys.key1])
        await sleep(2000)
        isStartRef.current = false
        checkNumRef.current = 0
      }
    }
  }

  /** 检测鱼饵 */
  const checkBait = async () => {
    if (keys.key3 && !(await isBait())) {
      await pressKey(Key[keys.key3])
      await sleep(5000)
      isStartRef.current = false
    }
  }

  /** 反馈 */
  const feedBack = (msg: string) => {
    fetch(`http://miaotixing.com/trigger?id=${FEEDBACK_CODE}&text=${msg}&type=jsonp`, {
      method: 'GET',
      mode: 'cors',
      credentials: 'same-origin'
    })
  }

  /** 检测是否正在钓鱼 */
  const isStartFish = async () => {
    const color = await colorAt({ x: config.processX, y: config.processY })
    saveLog(`检测是否正在钓鱼---${color}/标准色值：${config.processColor}`)
    return color === config.processColor
  }

  /** 检测是否重新连接 */
  const isReconnect = async () => {
    const color = await colorAt({ x: config.reconnectX, y: config.reconnectY })
    if (color === config.reconnectColor) {
      saveLog(`重新连接界面---${color}/标准色值：${config.reconnectColor}`)
    }
    return color === config.reconnectColor
  }

  /** 检测是否角色选择 */
  const isRole = async () => {
    const color = await colorAt({ x: config.logeX, y: config.logeY })
    if (color === config.logeColor) {
      saveLog(`角色界面---${color}/标准色值：${config.logeColor}`)
    }
    return color === config.logeColor
  }

  /** 检测是否鱼饵 */
  const isBait = async () => {
    const color = await colorAt({ x: config.baitX, y: config.baitY })
    if (!config.baitColor.includes(color)) {
      saveLog(`没有鱼饵---${color}/标准色值：${config.baitColor}`)
    }
    return config.baitColor.includes(color)
  }

  /** 保存日志 */
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
    <div style={styles.container}>
      <ConfigSection keys={keys} setKeys={setKeys} handleSystemChange={handleSystemChange} />
      <ControlSection
        startLoop={startLoop}
        stopLoop={stopLoop}
        handleReset={handleReset}
        getColor={getColor}
        isRunning={isRunning}
      />
      <LogSection />
    </div>
  )
}

// 配置部分组件
const ConfigSection: React.FC<{
  keys: FishKeys
  setKeys: React.Dispatch<React.SetStateAction<FishKeys>>
  handleSystemChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
}> = ({ keys, setKeys, handleSystemChange }) => {
  const handleKeyChange = (key: keyof FishKeys, value: string) => {
    setKeys((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div style={styles.section} className="section">
      <div style={styles.sectionTitle}>
        <span>⚙️</span>
        <span>基础配置</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {/* 左列 */}
        <div>
          <div style={{ ...styles.inputGroup }}>
            <span style={{ ...styles.label }}>甩杆键位:</span>
            <input
              style={{ ...styles.input, width: '60px' }}
              className="input"
              value={keys.key2}
              onChange={(e) => handleKeyChange('key2', e.target.value)}
            />
          </div>

          <div style={{ ...styles.inputGroup }}>
            <span style={{ ...styles.label }}>收杆键位:</span>
            <input
              style={{ ...styles.input, width: '60px' }}
              className="input"
              value={keys.key1}
              onChange={(e) => handleKeyChange('key1', e.target.value)}
            />
          </div>

          <div style={{ ...styles.inputGroup }}>
            <span style={{ ...styles.label }}>鱼饵键位:</span>
            <input
              style={{ ...styles.input, width: '60px' }}
              className="input"
              value={keys.key3}
              onChange={(e) => handleKeyChange('key3', e.target.value)}
            />
          </div>
        </div>

        {/* 右列 */}
        <div>
          <div style={{ ...styles.inputGroup }}>
            <span style={{ ...styles.label }}>角色选择:</span>
            <select
              style={{ ...styles.input, width: '100px' }}
              className="select"
              value={keys.key4}
              onChange={(e) => handleKeyChange('key4', e.target.value)}
            >
              {[1, 2, 3, 4, 5].map((num) => (
                <option key={num} value={num.toString()}>
                  {num}号位置
                </option>
              ))}
            </select>
          </div>

          <div style={{ ...styles.inputGroup }}>
            <span style={{ ...styles.label }}>系统选择:</span>
            <select
              style={{ ...styles.input, width: '100px' }}
              className="select"
              onChange={handleSystemChange}
            >
              <option value="win11-1K">Win11 (1K)</option>
              <option value="win11-2K">Win11 (2K)</option>
              <option value="win10-1K">Win10 (1K)</option>
            </select>
          </div>

          <div style={{ ...styles.inputGroup }}>
            <span style={{ ...styles.label }}>定时小退:</span>
            <select
              style={{ ...styles.input, width: '100px' }}
              className="select"
              value={keys.key5}
              onChange={(e) => handleKeyChange('key5', e.target.value)}
            >
              <option value="1">开启</option>
              <option value="0">关闭</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

// 控制按钮部分组件
const ControlSection: React.FC<{
  startLoop: () => Promise<void>
  stopLoop: () => void
  handleReset: () => void
  getColor: () => Promise<void>
  isRunning: boolean
}> = ({ startLoop, stopLoop, handleReset, getColor, isRunning }) => {
  return (
    <div style={styles.section} className="section">
      <div style={styles.sectionTitle}>
        <span>🎮</span>
        <span>操作控制</span>
      </div>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
        {!isRunning ? (
          <button
            onClick={startLoop}
            className="button-primary"
            style={{ ...styles.button.base, ...styles.button.primary }}
          >
            <span>▶️</span>
            <span>启动</span>
          </button>
        ) : (
          <button
            onClick={stopLoop}
            className="button-primary"
            style={{ ...styles.button.base, ...styles.button.primary }}
          >
            <span>⏹️</span>
            <span>停止</span>
          </button>
        )}
        <button
          onClick={handleReset}
          className="button-secondary"
          style={{ ...styles.button.base, ...styles.button.secondary }}
        >
          <span>🔄</span>
          <span>重置</span>
        </button>
        <button
          onClick={getColor}
          className="button-secondary"
          style={{ ...styles.button.base, ...styles.button.secondary }}
        >
          <span>🎨</span>
          <span>取色</span>
        </button>
      </div>
    </div>
  )
}

// 日志输出部分组件
const LogSection: React.FC = () => {
  return (
    <div style={styles.section} className="section">
      <div style={styles.sectionTitle}>
        <span>📝</span>
        <span>运行日志</span>
      </div>
      <textarea
        style={{
          width: '100%',
          height: '120px',
          padding: '8px 12px',
          border: `1.5px solid ${theme.colors.border}`,
          borderRadius: theme.borderRadius.sm,
          fontSize: theme.fontSize.sm,
          resize: 'vertical',
          outline: 'none'
        }}
        className="textarea"
        id="textarea"
        readOnly
      />
    </div>
  )
}

export default Fish
