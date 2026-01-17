import { useState } from 'react'
import type { UseCalculatorReturn } from '@/hooks/useCalculator'
import { useSavedLayouts } from '@/hooks/useSavedLayouts'
import { WallDimensions } from './WallDimensions'
import { LayoutTypeSelector } from './LayoutTypeSelector'
import { FrameSize } from './FrameSize'
import { GalleryFramesList } from './GalleryFramesList'
import { VerticalPosition } from './VerticalPosition'
import { HorizontalPosition } from './HorizontalPosition'
import { SaveLayoutDialog } from '@/components/SaveLayoutDialog'
import { SavedLayoutsDialog } from '@/components/SavedLayoutsDialog'
import { SettingsDialog } from '@/components/SettingsDialog'
import { Button } from '@/components/ui/button'
import { Link, Check, Save, FolderOpen, Settings } from 'lucide-react'

function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className}>
      <rect width="32" height="32" rx="6" fill="#4f46e5"/>
      <rect x="7" y="9" width="18" height="16" rx="1" stroke="white" strokeWidth="2" fill="none"/>
      <rect x="10" y="12" width="12" height="10" rx="0.5" stroke="white" strokeWidth="1" opacity="0.6" fill="none"/>
      <path d="M11 9 L16 5 L21 9" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="16" cy="5" r="1.5" fill="white"/>
    </svg>
  )
}

interface SidebarProps {
  calculator: UseCalculatorReturn
}

export function Sidebar({ calculator }: SidebarProps) {
  const { state } = calculator
  const { layouts, save, remove, load } = useSavedLayouts()
  const [copied, setCopied] = useState(false)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [loadDialogOpen, setLoadDialogOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col w-[360px] h-screen bg-white border-r border-gray-200 max-md:w-full max-md:max-h-[50vh] max-md:border-r-0 max-md:border-b">
      <div className="p-5 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Logo className="h-6 w-6" />
          Hang Time
        </h1>
        <p className="text-sm text-gray-500 mt-1">Picture perfect picture placement</p>

        <div className="flex gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleCopyLink}
          >
            {copied ? <><Check className="h-4 w-4" /> Copied!</> : <><Link className="h-4 w-4" /> Copy Link</>}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => setSaveDialogOpen(true)}
          >
            <Save className="h-4 w-4" /> Save
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => setLoadDialogOpen(true)}
          >
            <FolderOpen className="h-4 w-4" /> Saved
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <SaveLayoutDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onSave={save}
      />
      <SavedLayoutsDialog
        open={loadDialogOpen}
        onOpenChange={setLoadDialogOpen}
        layouts={layouts}
        onLoad={load}
        onDelete={remove}
      />
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        unit={state.unit}
        onUnitChange={calculator.setUnit}
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <WallDimensions calculator={calculator} />
        <LayoutTypeSelector calculator={calculator} />

        {state.layoutType !== 'gallery' && (
          <FrameSize calculator={calculator} />
        )}

        {state.layoutType === 'gallery' && (
          <GalleryFramesList calculator={calculator} />
        )}

        {state.layoutType !== 'gallery' && (
          <>
            <VerticalPosition calculator={calculator} />
            <HorizontalPosition calculator={calculator} />
          </>
        )}
      </div>
    </div>
  )
}
