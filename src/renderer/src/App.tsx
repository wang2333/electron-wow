import { useState } from 'react'

import Fish from './components/Fish'
import AutoKey from './components/AutoKey'
// import Monster from './components/Monster'

const App: React.FC = () => {
  const [active, setActive] = useState(2)

  return (
    <div className="tabs">
      <div className="tab-buttons">
        <a onClick={() => setActive(1)} className={active === 1 ? 'active' : ''}>
          钓鱼
        </a>
        <a onClick={() => setActive(2)} className={active === 2 ? 'active' : ''}>
          AHK
        </a>
        {/* <a onClick={() => setActive(3)} className={active === 3 ? 'active' : ''}>
          刷怪
        </a> */}
      </div>
      <div className="tab-contents">
        {active === 1 && <Fish />}
        {active === 2 && <AutoKey />}
        {/* {active === 3 && <Monster />} */}
      </div>
    </div>
  )
}

export default App
