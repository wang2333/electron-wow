import { useState, useEffect } from 'react'
import Fish from './components/Fish'
import AutoKey from './components/AutoKey'
import Login from './components/Login'
import { theme } from './styles/theme'

const App: React.FC = () => {
  const [active, setActive] = useState(2)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const loginStatus = localStorage.getItem('isLoggedIn')
    if (loginStatus === 'true') {
      setIsLoggedIn(true)
    }
  }, [])

  const handleLogin = (success: boolean) => {
    if (success) {
      setIsLoggedIn(true)
    }
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    localStorage.removeItem('isLoggedIn')
  }

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🎮</span>
          <span style={styles.logoText}>魔兽盒子</span>
        </div>
        <div style={styles.nav}>
          <a
            onClick={() => setActive(1)}
            style={{
              ...styles.navItem,
              ...(active === 1 ? styles.navItemActive : {})
            }}
          >
            <span style={styles.navIcon}>🎣</span>
            钓鱼
          </a>
          <a
            onClick={() => setActive(2)}
            style={{
              ...styles.navItem,
              ...(active === 2 ? styles.navItemActive : {})
            }}
          >
            <span style={styles.navIcon}>⚡</span>
            AHK
          </a>
        </div>
        <button onClick={handleLogout} style={styles.logoutButton}>
          <span style={styles.logoutIcon}>🚪</span>
          退出登录
        </button>
      </div>
      <div style={styles.content}>
        {active === 1 && <Fish />}
        {active === 2 && <AutoKey />}
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: theme.colors.secondary,
    display: 'flex',
    flexDirection: 'column' as const
  },
  header: {
    backgroundColor: '#fff',
    padding: '0.2rem 0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: theme.shadows.sm,
    position: 'sticky' as const,
    top: 0,
    zIndex: 100
  },
  logo: {
    display: 'flex',
    alignItems: 'center'
  },
  logoIcon: {
    fontSize: '1.5rem'
  },
  logoText: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: theme.colors.text.primary
  },
  nav: {
    display: 'flex',
    gap: '1rem'
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.2rem 0.5rem',
    borderRadius: theme.borderRadius.md,
    cursor: 'pointer',
    color: theme.colors.text.secondary
  },
  navItemActive: {
    backgroundColor: theme.colors.primaryLight,
    color: theme.colors.primary
  },
  navIcon: {
    fontSize: '1.2rem'
  },
  logoutButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.2rem 0.5rem',
    borderRadius: theme.borderRadius.md,
    border: 'none',
    backgroundColor: 'transparent',
    color: theme.colors.error.text,
    cursor: 'pointer'
  },
  logoutIcon: {
    fontSize: '1.2rem'
  },
  content: {
    flex: 1
  }
}

export default App
