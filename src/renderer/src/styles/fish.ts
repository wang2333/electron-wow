import { theme } from './theme'

export const fishStyles = {
  container: {
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    maxWidth: '520px',
    margin: '15px auto',
    boxShadow: theme.shadows.md,
    transition: theme.transitions.default
  },

  section: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.md,
    boxShadow: theme.shadows.sm,
    transition: theme.transitions.default
  },

  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.xs
  },

  inputGroup: {
    marginBottom: '6px',
    display: 'flex',
    alignItems: 'center'
  },

  label: {
    display: 'inline-block',
    width: '70px',
    fontWeight: '600',
    color: theme.colors.text.primary,
    fontSize: '12px'
  },

  input: {
    width: '60px',
    padding: '4px 8px',
    border: `1.5px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.sm,
    fontSize: theme.fontSize.sm,
    transition: theme.transitions.default,
    outline: 'none'
  },

  select: {
    width: '100px',
    padding: '4px 8px',
    border: `1.5px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.sm,
    fontSize: theme.fontSize.sm,
    transition: theme.transitions.default,
    outline: 'none'
  },

  textarea: {
    width: '100%',
    height: '120px',
    padding: '8px 12px',
    border: `1.5px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.sm,
    fontSize: theme.fontSize.sm,
    resize: 'vertical',
    outline: 'none'
  },

  button: {
    base: {
      padding: `${theme.spacing.sm} ${theme.spacing.md}`,
      borderRadius: theme.borderRadius.sm,
      border: 'none',
      cursor: 'pointer',
      fontSize: theme.fontSize.sm,
      fontWeight: '600',
      transition: theme.transitions.default,
      outline: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.xs
    },
    primary: {
      backgroundColor: theme.colors.primary,
      color: 'white',
      boxShadow: '0 2px 4px rgba(76, 175, 80, 0.2)'
    },
    secondary: {
      backgroundColor: theme.colors.secondary,
      color: theme.colors.text.primary,
      border: `1.5px solid ${theme.colors.border}`
    }
  },

  configGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px'
  },

  buttonGroup: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center'
  }
} as const
