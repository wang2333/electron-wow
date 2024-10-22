import { useState } from 'react'

import Monster from './components/Monster'
import Fish from './components/Fish'
import AutoKey from './components/AutoKey'

const App: React.FC = () => {
  const [active, setActive] = useState(3)

  return (
    <div className="tabs">
      <div className="tab-buttons">
        <a onClick={() => setActive(1)} className={active === 1 ? 'active' : ''}>
          刷怪
        </a>
        <a onClick={() => setActive(2)} className={active === 2 ? 'active' : ''}>
          钓鱼
        </a>
        <a onClick={() => setActive(3)} className={active === 3 ? 'active' : ''}>
          取色
        </a>
      </div>
      <div className="tab-contents">
        {active === 1 && <Monster />}
        {active === 2 && <Fish />}
        {active === 3 && <AutoKey />}
      </div>
    </div>
  )
}

export default App
