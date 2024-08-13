import { Key } from '@renderer/Util/Key'
import { colorAt, pressKey } from '@renderer/Util/mouseContril'
import { useRef, useState } from 'react'

const Fish: React.FC = () => {
  const [key1, setKey1] = useState('1')
  const [key2, setKey2] = useState('2')
  const [micX, setMicX] = useState(500)
  const [micY, setMicY] = useState(300)
  const [color, setColor] = useState('#0067c0')

  // 脚本循环开关
  const stopLoopRef = useRef(false)

  /** 脚本开始 */
  const startLoop = async () => {
    stopLoopRef.current = false
    setTimeout(() => {
      loop()
    }, 500)
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

  /** 无限循环执行脚本 */
  const loop = async () => {
    while (!stopLoopRef.current) {
      await pressKey(Key[key1])

      const c = await colorAt({ x: micX, y: micY })
      if (c.includes(color)) {
        console.log('object :>> ', '鱼上钩')
        await pressKey(Key[key2])
        await sleep(1500)
      }
      await sleep(500)
    }
  }

  const sleep = async (time: number) => {
    await new Promise((resolve) => setTimeout(resolve, time))
  }
  return (
    <div className={'fish'}>
      <div className="config">
        <div className="item">
          <span>甩干：</span>
          <input value={key1} placeholder={'甩干'} onChange={(e) => setKey1(e.target.value)} />
        </div>
        <div className="item">
          <span>收杆：</span>
          <input value={key2} placeholder={'收杆'} onChange={(e) => setKey2(e.target.value)} />
        </div>

        <div className="item">
          <span>音量坐标：</span>
          <input
            type="number"
            value={micX}
            placeholder={'x坐标'}
            onChange={(e) => setMicX(+e.target.value)}
          />
          <input
            type="number"
            value={micY}
            placeholder={'y坐标'}
            onChange={(e) => setMicY(+e.target.value)}
          />
        </div>
        <div className="item">
          <span>音量色值：</span>
          <input value={color} placeholder={'甩干'} onChange={(e) => setColor(e.target.value)} />
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
      </div>
    </div>
  )
}

export default Fish
