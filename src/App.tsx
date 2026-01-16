import { useCalculator } from '@/hooks/useCalculator'
import { Sidebar } from '@/components/Sidebar'
import { Preview } from '@/components/Preview'
import { Measurements } from '@/components/Measurements'
import { HowToHang } from '@/components/HowToHang'

export function App() {
  const calculator = useCalculator()

  return (
    <div className="flex h-screen max-md:flex-col">
      <Sidebar calculator={calculator} />
      <main className="flex-1 flex flex-col gap-4 p-6 bg-gray-100 overflow-auto">
        <Preview calculator={calculator} />
        <Measurements calculator={calculator} />
        <HowToHang calculator={calculator} />
      </main>
    </div>
  )
}
