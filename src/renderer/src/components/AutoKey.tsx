import React, { useState, useEffect, useCallback } from 'react'
import { COLOR_TO_NAME_MAP, NAME_TO_KEYBORD_MAP } from '@renderer/constants/mappings'
import { colorAt, pressKeys } from '@renderer/Util/mouseContril'
import { Key } from '../Util/Key'

const AUTO_KEY_INTERVAL = 100 // 自动按键的间隔时间（毫秒）

const AutoKey: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isBao, setIsBao] = useState(false)
  const [currentKey, setCurrentKey] = useState('')
  const [normalX, setNormalX] = useState(100)
  const [baoX, setBaoX] = useState(200)
  const [monitorY, setMonitorY] = useState(100)

  const handleShortcut = useCallback((info: string) => {
    if (info === 'F1') {
      setIsOpen((prev) => !prev)
    } else if (info === 'F2') {
      setIsBao((prev) => !prev)
    }
  }, [])

  const performAutoKey = useCallback(async () => {
    const monitorX = isBao ? baoX : normalX
    const color = await colorAt({ x: monitorX, y: monitorY })

    const keyName = COLOR_TO_NAME_MAP[color]
    if (keyName) {
      const keyCode = NAME_TO_KEYBORD_MAP[keyName].split('-')
      const keyArr = keyCode.map((key) => Key[key])
      await pressKeys(...keyArr)
      setCurrentKey(keyCode.join('-'))
    }
  }, [isBao, baoX, normalX, monitorY])

  useEffect(() => {
    const listener = (_, info) => handleShortcut(info)
    window.electron.ipcRenderer.on('shortcut-pressed', listener)
    return () => {
      window.electron.ipcRenderer.removeListener('shortcut-pressed', listener)
    }
  }, [handleShortcut])

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null

    if (isOpen) {
      intervalId = setInterval(performAutoKey, AUTO_KEY_INTERVAL)
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [isOpen, performAutoKey])

  return (
    <div>
      <CoordinateInput label="普通模式 X:" value={normalX} onChange={setNormalX} />
      <CoordinateInput label="爆发模式 X:" value={baoX} onChange={setBaoX} />
      <CoordinateInput label="监听坐标 Y:" value={monitorY} onChange={setMonitorY} />
      <StatusDisplay label="是否开启:" value={isOpen} />
      <StatusDisplay label="是否爆发:" value={isBao} />
      <StatusDisplay label="当前按键:" value={currentKey} />
    </div>
  )
}

interface CoordinateInputProps {
  label: string
  value: number
  onChange: (value: number) => void
}

const CoordinateInput: React.FC<CoordinateInputProps> = ({ label, value, onChange }) => (
  <div>
    <label>{label} </label>
    <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} />
  </div>
)

interface StatusDisplayProps {
  label: string
  value: boolean | string
}

const StatusDisplay: React.FC<StatusDisplayProps> = ({ label, value }) => (
  <div>
    {label} {typeof value === 'boolean' ? (value ? '是' : '否') : value}
  </div>
)

export default AutoKey
