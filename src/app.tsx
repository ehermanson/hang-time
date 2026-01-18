import { useCalculator } from '@/hooks/use-calculator'
import { ThemeProvider, useTheme } from '@/hooks/use-theme'
import { Sidebar } from '@/components/sidebar/sidebar'
import { Preview } from '@/components/preview'
import { cn } from '@/lib/utils'

function AppContent() {
  const calculator = useCalculator()
  const { theme } = useTheme()

  return (
    <div className={cn(
      "relative h-screen w-screen overflow-hidden transition-colors duration-300",
      theme === 'dark'
        ? "bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950"
        : "bg-gradient-to-br from-slate-100 via-slate-50 to-indigo-50"
    )}>
      {/* Full-screen preview canvas */}
      <Preview calculator={calculator} />

      {/* Floating sidebar */}
      <Sidebar calculator={calculator} />
    </div>
  )
}

export function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}
