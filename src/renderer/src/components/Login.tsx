import React, { useState } from 'react'
import request from '../Util/axios'

interface LoginProps {
  onLogin: (success: boolean) => void
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [userName, setUserName] = useState('admin')
  const [password, setPassword] = useState('123456')
  const [error, setError] = useState('')

  const handleLogin = async () => {
    try {
      const isValid = await request<boolean>('/api/verifyUser', {
        method: 'GET',
        params: {
          userName,
          password
        }
      })
      if (isValid) {
        setError('')
        onLogin(true)
        localStorage.setItem('isLoggedIn', 'true')
      } else {
        setError('用户名或密码错误')
      }
    } catch (err) {
      setError('登录失败，请联系管理员')
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.loginBox}>
        <h2 style={styles.title}>登录</h2>
        {error && <div style={styles.error}>{error}</div>}
        <div style={styles.inputGroup}>
          <input
            style={styles.input}
            type="text"
            placeholder="用户名"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
        </div>
        <div style={styles.inputGroup}>
          <input
            style={styles.input}
            type="password"
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button style={styles.button} onClick={handleLogin}>
          登录
        </button>
      </div>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh'
  },
  loginBox: {
    padding: '2rem',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    width: '300px'
  },
  title: {
    textAlign: 'center' as const,
    marginBottom: '2rem',
    color: '#1a1a1a'
  },
  inputGroup: {
    marginBottom: '1rem'
  },
  input: {
    width: '100%',
    padding: '0.5rem',
    border: '1px solid #d9d9d9',
    borderRadius: '4px',
    fontSize: '14px'
  },
  button: {
    width: '100%',
    padding: '0.5rem',
    backgroundColor: '#1890ff',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    ':hover': {
      backgroundColor: '#40a9ff'
    }
  },
  error: {
    color: '#ff4d4f',
    marginBottom: '1rem',
    textAlign: 'center' as const,
    fontSize: '14px'
  }
}

export default Login
