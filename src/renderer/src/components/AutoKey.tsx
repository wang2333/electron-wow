import React, { useCallback, useEffect, useRef, useState } from 'react'

import closeSound from '@renderer/assets/close.mp3'
import closeBaoSound from '@renderer/assets/closeBao.mp3'
import openSound from '@renderer/assets/open.mp3'
import openBaoSound from '@renderer/assets/openBao.mp3'
import { COLOR_TO_KEY_MAP } from '@renderer/constants/mappings'
import { getColorFromImageData, grabRegion, pressKeys } from '@renderer/Util/mouseContril'
import { Key } from '../Util/Key'

import { autoKeyStyles as styles } from '@renderer/styles/autoKey'

// 类型定义
interface AutoKeyState {
  isOpen: boolean
  isBao: boolean
  currentKey: string
  normalX: number
  baoX: number
  monitorY: number
  targetPath: string
}

const AutoKey: React.FC = () => {
  // 状态管理
  const [state, setState] = useState<AutoKeyState>({
    isOpen: false,
    isBao: false,
    currentKey: '',
    normalX: 1,
    baoX: 2550,
    monitorY: 25,
    targetPath: ''
  })

  // 音频引用
  const audioRefs = {
    open: useRef(new Audio(openSound)),
    close: useRef(new Audio(closeSound)),
    openBao: useRef(new Audio(openBaoSound)),
    closeBao: useRef(new Audio(closeBaoSound))
  }

  // 状态引用
  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])

  // 快捷键处理
  const handleShortcut = useCallback(
    (info: string) => {
      if (info === 'F1') {
        setState((prev) => {
          const newState = { ...prev, isOpen: !prev.isOpen }
          if (newState.isOpen) {
            audioRefs.open.current.play()
          } else {
            audioRefs.close.current.play()
          }
          return newState
        })
      } else if (info === 'F2') {
        setState((prev) => {
          const newState = { ...prev, isBao: !prev.isBao }
          if (newState.isBao) {
            audioRefs.openBao.current.play()
          } else {
            audioRefs.closeBao.current.play()
          }
          return newState
        })
      }
    },
    [audioRefs]
  )

  // 自动按键逻辑
  const performAutoKey = useCallback(async () => {
    const currentState = stateRef.current
    if (!currentState.isOpen) return

    const monitorX = currentState.isBao ? currentState.baoX : currentState.normalX
    const imageData = await grabRegion(monitorX, currentState.monitorY, 1, 1)
    const { r, g, b } = getColorFromImageData(imageData)
    const hexColor = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`

    console.log('👻 ~ hexColor:', hexColor)
    const keyName = COLOR_TO_KEY_MAP[hexColor]
    if (keyName) {
      const keyArr = keyName.split('-').map((key) => Key[key])
      await pressKeys(...keyArr)
      setState((prev) => ({ ...prev, currentKey: keyName }))
    }
  }, [])

  // 文件操作
  const handleSelectPath = async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke('select-folder')
      if (result) {
        setState((prev) => ({ ...prev, targetPath: result }))
      }
    } catch (error) {
      console.error('选择路径失败:', error)
    }
  }

  const handleCopyFolder = async () => {
    if (!state.targetPath) {
      alert('请先选择目标路径')
      return
    }

    try {
      await window.electron.ipcRenderer.invoke('copy-folder', state.targetPath)
      alert('安装成功')
    } catch (error) {
      console.error('安装失败:', error)
      alert('安装失败')
    }
  }

  // 效果处理
  useEffect(() => {
    const listener = (_, info) => handleShortcut(info)
    window.electron.ipcRenderer.on('shortcut-pressed', listener)
    return () => {
      window.electron.ipcRenderer.removeListener('shortcut-pressed', listener)
      stateRef.current.isOpen = false
    }
  }, [handleShortcut])

  useEffect(() => {
    if (state.isOpen) {
      const autoKeyLoop = async () => {
        await performAutoKey()
        if (stateRef.current.isOpen) {
          setTimeout(() => requestAnimationFrame(autoKeyLoop), Math.random() * 100)
        }
      }
      requestAnimationFrame(autoKeyLoop)
    }
  }, [state.isOpen, performAutoKey])

  return (
    <div style={styles.container}>
      <PathSection
        targetPath={state.targetPath}
        onSelectPath={handleSelectPath}
        onCopyFolder={handleCopyFolder}
      />
      <StatusSection state={state} />
      <CoordinateSection state={state} setState={setState} />
    </div>
  )
}

// 子组件定义
const StatusSection: React.FC<{ state: AutoKeyState }> = ({ state }) => (
  <div style={styles.section} className="section">
    <div style={styles.sectionTitle}>
      <span>📊</span>
      <span>状态监控</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <StatusDisplay label="运行状态:" value={state.isOpen} />
      <StatusDisplay label="爆发模式:" value={state.isBao} />
      <StatusDisplay label="当前按键:" value={state.currentKey || '等待操作'} />
    </div>
  </div>
)

const CoordinateSection: React.FC<{
  state: AutoKeyState
  setState: React.Dispatch<React.SetStateAction<AutoKeyState>>
}> = ({ state, setState }) => (
  <div style={styles.section} className="section">
    <div style={styles.sectionTitle}>
      <span>⚙️</span>
      <span>坐标配置</span>
    </div>
    <CoordinateInput
      label="普通模式 X:"
      value={state.normalX}
      onChange={(value) => setState((prev) => ({ ...prev, normalX: value }))}
    />
    <CoordinateInput
      label="爆发模式 X:"
      value={state.baoX}
      onChange={(value) => setState((prev) => ({ ...prev, baoX: value }))}
    />
    <CoordinateInput
      label="监听坐标 Y:"
      value={state.monitorY}
      onChange={(value) => setState((prev) => ({ ...prev, monitorY: value }))}
    />
  </div>
)

const PathSection: React.FC<{
  targetPath: string
  onSelectPath: () => void
  onCopyFolder: () => void
}> = ({ targetPath, onSelectPath, onCopyFolder }) => (
  <div style={styles.section} className="section">
    <div style={styles.sectionTitle}>
      <span>🎮</span>
      <span>游戏路径设置</span>
    </div>
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <input
        style={styles.pathInput}
        className="path-input"
        type="text"
        value={targetPath}
        readOnly
        placeholder="请选择游戏安装路径..."
      />
      <button
        onClick={onSelectPath}
        className="button-secondary"
        style={{
          ...styles.button.base,
          ...styles.button.secondary,
          padding: '8px 12px'
        }}
      >
        <span>📂</span>
      </button>
      <button
        onClick={onCopyFolder}
        className="button-primary"
        style={{
          ...styles.button.base,
          ...styles.button.primary,
          padding: '8px 12px'
        }}
      >
        <span>安装</span>
      </button>
    </div>
  </div>
)

interface CoordinateInputProps {
  label: string
  value: number
  onChange: (value: number) => void
}

const CoordinateInput: React.FC<CoordinateInputProps> = ({ label, value, onChange }) => (
  <div style={styles.inputGroup}>
    <label style={styles.label}>{label}</label>
    <input
      style={styles.input}
      className="input"
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
  const getStatusStyles = () => {
    if (typeof value === 'boolean') {
      return {
        backgroundColor: value ? '#ecfdf5' : '#fef2f2',
        color: value ? '#065f46' : '#991b1b',
        border: `1px solid ${value ? '#a7f3d0' : '#fecaca'}`,
        padding: '4px 10px'
      }
    }
    return {
      backgroundColor: '#eff6ff',
      color: '#1e40af',
      border: '1px solid #bfdbfe',
      padding: '4px 10px'
    }
  }

  return (
    <span>
      <span style={styles.label}>{label}</span>
      <span style={{ ...styles.status.value, ...getStatusStyles() }}>
        {typeof value === 'boolean' && (
          <span
            style={{
              ...styles.status.icon,
              backgroundColor: value ? '#059669' : '#dc2626'
            }}
          />
        )}
        {typeof value === 'boolean' ? (value ? '开启' : '关闭') : value}
      </span>
    </span>
  )
}

export default AutoKey
