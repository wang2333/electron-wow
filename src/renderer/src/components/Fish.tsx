import { useRef, useState } from 'react'

import { colorAt, mouseLeftClick, mouseRightClick, pressKey } from '@renderer/Util/mouseContril'
import { Key } from '@renderer/Util/Key'

const Fish: React.FC = () => {
  const [key1, setKey1] = useState('F')
  const [key2, setKey2] = useState('Q')
  const [micX, setMicX] = useState(1730)
  const [micY, setMicY] = useState(161)
  const [color, setColor] = useState('#1d6978')

  // 脚本循环开关
  const stopLoopRef = useRef(false)
  // 标记是否已经甩杆
  const isStartRef = useRef(false)
  const startTimeRef = useRef(0)
  const checkNumRef = useRef(0)

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
      if (!isStartRef.current || new Date().getTime() - startTimeRef.current > 17 * 1000) {
        await pressKey(Key[key2])
        await sleep(2000)
        isStartRef.current = true
        startTimeRef.current = new Date().getTime()
      }

      if (isStartRef.current) {
        const c = await colorAt({ x: micX, y: micY })
        if (c.includes(color)) {
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

      await sleep(50)
    }
  }

  const sleep = async (time: number) => {
    // 生成一个0.8到1之间的随机数
    const randomMultiplier = 0.8 + Math.random() * 0.2
    // 计算延迟时间
    const randomDelay = time * randomMultiplier

    await new Promise((resolve) => setTimeout(resolve, randomDelay))
  }
  return (
    <div className={'fish'}>
      <div className="config">
        {/* <div className="item">
          <span>甩干：</span>
          <input value={key1} placeholder={'甩干'} onChange={(e) => setKey1(e.target.value)} />
        </div>
        <div className="item">
          <span>收杆：</span>
          <input value={key2} placeholder={'收杆'} onChange={(e) => setKey2(e.target.value)} />
        </div> */}

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
