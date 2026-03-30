'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button className="flex h-8 items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs font-medium transition-colors">
        <Sun className="h-3.5 w-3.5 text-primary" />
        <span className="text-muted-foreground">Light</span>
      </button>
    )
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="flex h-8 items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs font-medium transition-all hover:border-primary hover:bg-accent"
    >
      {theme === 'dark' ? (
        <>
          <Moon className="h-3.5 w-3.5 text-primary" />
          <span className="text-foreground">Dark</span>
        </>
      ) : (
        <>
          <Sun className="h-3.5 w-3.5 text-primary" />
          <span className="text-foreground">Light</span>
        </>
      )}
      <span className="sr-only">Cambiar tema</span>
    </button>
  )
}
