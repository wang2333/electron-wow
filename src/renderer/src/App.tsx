import { useState } from 'react'

import Monster from './components/Monster'
import Fish from './components/Fish'

const App: React.FC = () => {
  const [active, setActive] = useState(2)

  return (
    <div className="tabs">
      <div className="tab-buttons">
        <a onClick={() => setActive(1)} className={active === 1 ? 'active' : ''}>
          刷怪
        </a>
        <a onClick={() => setActive(2)} className={active === 2 ? 'active' : ''}>
          钓鱼
        </a>
      </div>
      <div className="tab-contents">
        {active === 1 && <Monster />}
        {active === 2 && <Fish />}
      </div>
    </div>
  )
}

export default App
