import type { SavedLayout } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface SavedLayoutsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  layouts: SavedLayout[]
  onLoad: (layout: SavedLayout) => void
  onDelete: (id: string) => void
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function SavedLayoutsDialog({
  open,
  onOpenChange,
  layouts,
  onLoad,
  onDelete,
}: SavedLayoutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Saved Layouts</DialogTitle>
          <DialogDescription>
            Click a layout to load it.
          </DialogDescription>
        </DialogHeader>

        {layouts.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <p>No saved layouts yet.</p>
            <p className="text-sm mt-1">Use the Save button to save your current layout.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {layouts.map((layout) => (
              <div
                key={layout.id}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer transition-colors"
                onClick={() => onLoad(layout)}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {layout.title}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDate(layout.createdAt)}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2 text-gray-400 hover:text-red-600 hover:bg-red-50"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(layout.id)
                  }}
                >
                  🗑️
                </Button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
