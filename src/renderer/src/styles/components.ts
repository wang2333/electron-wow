import { theme } from './theme'

export const styles = {
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

  inputGroup: {
    marginBottom: theme.spacing.sm,
    display: 'flex',
    alignItems: 'center'
  },

  label: {
    display: 'inline-block',
    width: '100px',
    fontWeight: '600',
    color: theme.colors.text.primary,
    fontSize: theme.fontSize.sm
  },

  input: {
    width: '120px',
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    border: `1.5px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.sm,
    fontSize: theme.fontSize.sm,
    transition: theme.transitions.default,
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

  pathInput: {
    flex: 1,
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    border: `1.5px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.secondary,
    color: theme.colors.text.primary,
    fontSize: theme.fontSize.sm,
    transition: theme.transitions.default,
    outline: 'none'
  },

  status: {
    value: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: `${theme.spacing.xs} ${theme.spacing.md}`,
      borderRadius: theme.borderRadius.sm,
      fontSize: theme.fontSize.sm,
      fontWeight: '600',
      transition: theme.transitions.default,
      gap: theme.spacing.xs
    },
    icon: {
      width: '6px',
      height: '6px',
      borderRadius: '50%',
      marginRight: theme.spacing.xs
    }
  },

  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.xs
  }
} as const
