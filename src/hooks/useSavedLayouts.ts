import { useState, useEffect, useCallback } from 'react'
import type { SavedLayout } from '@/types'

const STORAGE_KEY = 'picture-hanging-layouts'

export function useSavedLayouts() {
  const [layouts, setLayouts] = useState<SavedLayout[]>([])

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setLayouts(JSON.parse(stored))
      }
    } catch {
      // Invalid JSON, start fresh
      setLayouts([])
    }
  }, [])

  // Sync to localStorage whenever layouts change
  const syncToStorage = useCallback((newLayouts: SavedLayout[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newLayouts))
    setLayouts(newLayouts)
  }, [])

  const save = useCallback((title: string) => {
    const layout: SavedLayout = {
      id: crypto.randomUUID(),
      title: title.trim() || 'Untitled Layout',
      url: window.location.search,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    syncToStorage([...layouts, layout])
  }, [layouts, syncToStorage])

  const remove = useCallback((id: string) => {
    syncToStorage(layouts.filter(l => l.id !== id))
  }, [layouts, syncToStorage])

  const load = useCallback((layout: SavedLayout) => {
    // Navigate to the saved URL
    window.location.search = layout.url
  }, [])

  return {
    layouts,
    save,
    remove,
    load,
  }
}

export type UseSavedLayoutsReturn = ReturnType<typeof useSavedLayouts>
