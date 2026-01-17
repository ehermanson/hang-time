import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface SaveLayoutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (title: string) => void
}

export function SaveLayoutDialog({ open, onOpenChange, onSave }: SaveLayoutDialogProps) {
  const [title, setTitle] = useState('')

  const handleSave = () => {
    onSave(title)
    setTitle('')
    onOpenChange(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && title.trim()) {
      handleSave()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save Layout</DialogTitle>
          <DialogDescription>
            Give this layout a name to save it for later.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="layout-title">Title</Label>
          <Input
            id="layout-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g., Living Room Gallery"
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!title.trim()}>
            Save Layout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
