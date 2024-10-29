// 定义主题颜色和通用样式变量
export const theme = {
  colors: {
    primary: '#4CAF50',
    primaryHover: '#43a047',
    primaryLight: 'rgba(76, 175, 80, 0.1)',
    secondary: '#f8f9fa',
    secondaryHover: '#f1f3f5',
    text: {
      primary: '#2c3e50',
      secondary: '#666666'
    },
    border: '#e2e8f0',
    borderHover: '#cbd5e0',
    success: {
      bg: '#ecfdf5',
      text: '#065f46',
      border: '#a7f3d0',
      icon: '#059669'
    },
    error: {
      bg: '#fef2f2',
      text: '#991b1b',
      border: '#fecaca',
      icon: '#dc2626'
    },
    info: {
      bg: '#eff6ff',
      text: '#1e40af',
      border: '#bfdbfe'
    }
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px'
  },
  borderRadius: {
    sm: '6px',
    md: '8px',
    lg: '12px'
  },
  fontSize: {
    xs: '12px',
    sm: '13px',
    md: '14px',
    lg: '16px'
  },
  shadows: {
    sm: '0 2px 6px rgba(0, 0, 0, 0.04)',
    md: '0 4px 12px rgba(0, 0, 0, 0.08)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.12)'
  },
  transitions: {
    default: 'all 0.2s ease'
  }
} as const
