import { useState } from 'react'
import type { UseCalculatorReturn } from '@/hooks/useCalculator'
import { useSavedLayouts } from '@/hooks/useSavedLayouts'
import { WallDimensions } from './WallDimensions'
import { LayoutTypeSelector } from './LayoutTypeSelector'
import { FrameSize } from './FrameSize'
import { SalonFramesList } from './SalonFramesList'
import { VerticalPosition } from './VerticalPosition'
import { HorizontalPosition } from './HorizontalPosition'
import { SaveLayoutDialog } from '@/components/SaveLayoutDialog'
import { SavedLayoutsDialog } from '@/components/SavedLayoutsDialog'
import { SettingsDialog } from '@/components/SettingsDialog'
import { Button } from '@/components/ui/button'
import { Frame, Link, Check, Save, FolderOpen, Settings } from 'lucide-react'

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
          <Frame className="h-5 w-5 text-indigo-600" />
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

        {state.layoutType !== 'salon' && (
          <FrameSize calculator={calculator} />
        )}

        {state.layoutType === 'salon' && (
          <SalonFramesList calculator={calculator} />
        )}

        {state.layoutType !== 'salon' && (
          <>
            <VerticalPosition calculator={calculator} />
            <HorizontalPosition calculator={calculator} />
          </>
        )}
      </div>
    </div>
  )
}
