import React, { useCallback, useEffect, useState } from 'react'

import closeSound from '@renderer/assets/close.mp3'
import closeBaoSound from '@renderer/assets/closeBao.mp3'
import openSound from '@renderer/assets/open.mp3'
import openBaoSound from '@renderer/assets/openBao.mp3'
import { COLOR_TO_NAME_MAP, NAME_TO_KEYBORD_MAP } from '@renderer/constants/mappings'
import { colorAt, pressKeys } from '@renderer/Util/mouseContril'
import { Key } from '../Util/Key'

const AUTO_KEY_INTERVAL = 0 // 自动按键的间隔时间（毫秒）

const containerStyle: React.CSSProperties = {
  color: '#333',
  backgroundColor: '#f0f0f0',
  borderRadius: '8px',
  padding: '20px',
  maxWidth: '400px',
  margin: '20px auto',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
}

const inputGroupStyle: React.CSSProperties = {
  marginBottom: '15px'
}

const labelStyle: React.CSSProperties = {
  display: 'inline-block',
  width: '120px',
  fontWeight: 'bold'
}

const inputStyle: React.CSSProperties = {
  width: '100px',
  padding: '5px',
  border: '1px solid #ccc',
  borderRadius: '4px'
}

const statusGroupStyle: React.CSSProperties = {
  marginTop: '20px'
}

const statusItemStyle: React.CSSProperties = {
  marginBottom: '10px',
  display: 'flex',
  alignItems: 'center'
}

const statusValueStyle: React.CSSProperties = {
  marginLeft: '10px',
  padding: '2px 8px',
  borderRadius: '4px',
  fontWeight: 'bold'
}

const AutoKey: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isBao, setIsBao] = useState(false)
  const [currentKey, setCurrentKey] = useState('')
  const [normalX, setNormalX] = useState(1)
  const [baoX, setBaoX] = useState(2550)
  const [monitorY, setMonitorY] = useState(25)

  // 创建音频对象
  const [openAudio] = useState(new Audio(openSound))
  const [closeAudio] = useState(new Audio(closeSound))
  const [openBaoAudio] = useState(new Audio(openBaoSound))
  const [closeBaoAudio] = useState(new Audio(closeBaoSound))

  const handleShortcut = useCallback(
    (info: string) => {
      if (info === 'F1') {
        setIsOpen((prev) => {
          const newState = !prev
          if (newState) {
            openAudio.play() // 播放开启音效
          } else {
            closeAudio.play() // 播放关闭音效
          }
          return newState
        })
      } else if (info === 'F2') {
        setIsBao((prev) => {
          const newState = !prev
          if (newState) {
            openBaoAudio.play() // 播放开启音效
          } else {
            closeBaoAudio.play() // 播放关闭音效
          }
          return newState
        })
      }
    },
    [openAudio, closeAudio]
  )

  const performAutoKey = useCallback(async () => {
    const monitorX = isBao ? baoX : normalX
    const [color] = await Promise.all([colorAt({ x: monitorX, y: monitorY })])

    const keyName = COLOR_TO_NAME_MAP[color.substring(0, 7)]
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
    <div style={containerStyle}>
      <div style={inputGroupStyle}>
        <CoordinateInput label="普通模式 X:" value={normalX} onChange={setNormalX} />
      </div>
      <div style={inputGroupStyle}>
        <CoordinateInput label="爆发模式 X:" value={baoX} onChange={setBaoX} />
      </div>
      <div style={inputGroupStyle}>
        <CoordinateInput label="监听坐标 Y:" value={monitorY} onChange={setMonitorY} />
      </div>
      <div style={statusGroupStyle}>
        <StatusDisplay label="是否开启:" value={isOpen} />
        <StatusDisplay label="是否爆发:" value={isBao} />
        <StatusDisplay label="当前按键:" value={currentKey} />
      </div>
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
    <label style={labelStyle}>{label}</label>
    <input
      style={inputStyle}
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  </div>
)

interface StatusDisplayProps {
  label: string
  value: boolean | string
}

const StatusDisplay: React.FC<StatusDisplayProps> = ({ label, value }) => {
  const valueStyle: React.CSSProperties = {
    ...statusValueStyle
  }

  if (typeof value === 'boolean') {
    valueStyle.backgroundColor = value ? '#4CAF50' : '#F44336'
    valueStyle.color = 'white'
  } else {
    valueStyle.backgroundColor = '#2196F3'
    valueStyle.color = 'white'
  }

  return (
    <div style={statusItemStyle}>
      <span style={labelStyle}>{label}</span>
      <span style={valueStyle}>{typeof value === 'boolean' ? (value ? '是' : '否') : value}</span>
    </div>
  )
}

export default AutoKey
