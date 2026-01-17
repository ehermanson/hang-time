import { useEffect } from 'react'
import type { Unit } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Ruler } from 'lucide-react'

const UNIT_STORAGE_KEY = 'picture-hanging-unit'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  unit: Unit
  onUnitChange: (unit: Unit) => void
}

const unitOptions: { value: Unit; label: string; desc: string }[] = [
  { value: 'in', label: 'Inches', desc: 'Imperial measurements (e.g., 57")' },
  { value: 'cm', label: 'Centimeters', desc: 'Metric measurements (e.g., 145 cm)' },
]

export function SettingsDialog({
  open,
  onOpenChange,
  unit,
  onUnitChange,
}: SettingsDialogProps) {
  // Save unit preference to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(UNIT_STORAGE_KEY, unit)
  }, [unit])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your preferences.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Measurement Units */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Ruler className="h-4 w-4 text-gray-500" />
              <Label className="text-sm font-medium">Measurement Units</Label>
            </div>
            <div className="space-y-2">
              {unitOptions.map((opt) => (
                <label
                  key={opt.value}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    unit === opt.value
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  )}
                  onClick={() => onUnitChange(opt.value)}
                >
                  <input
                    type="radio"
                    name="unit"
                    checked={unit === opt.value}
                    onChange={() => {}}
                    className="accent-indigo-600"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{opt.label}</div>
                    <div className="text-xs text-gray-500">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Future settings sections can be added here */}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Helper to load saved unit preference
export function loadSavedUnit(): Unit | null {
  const saved = localStorage.getItem(UNIT_STORAGE_KEY)
  if (saved === 'in' || saved === 'cm') {
    return saved
  }
  return null
}
