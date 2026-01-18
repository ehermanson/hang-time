import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SavedLayout } from '@/types';

const STORAGE_KEY = 'picture-hanging-layouts';
const LOADED_LAYOUT_KEY = 'picture-hanging-loaded-layout-id';

export function useSavedLayouts() {
  const [layouts, setLayouts] = useState<SavedLayout[]>([]);
  const [loadedLayoutId, setLoadedLayoutId] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState(window.location.search);
  const [isDetached, setIsDetached] = useState(false);

  // Track URL changes to detect modifications
  useEffect(() => {
    const checkUrl = () => {
      if (window.location.search !== currentUrl) {
        setCurrentUrl(window.location.search);
        // Clear detached state when URL changes (user made modifications)
        setIsDetached(false);
      }
    };

    // Check on popstate (back/forward)
    window.addEventListener('popstate', checkUrl);

    // Also poll for programmatic URL changes (nuqs uses replaceState)
    const interval = setInterval(checkUrl, 100);

    return () => {
      window.removeEventListener('popstate', checkUrl);
      clearInterval(interval);
    };
  }, [currentUrl]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setLayouts(JSON.parse(stored));
      }
      // Restore which layout was loaded
      const loadedId = sessionStorage.getItem(LOADED_LAYOUT_KEY);
      if (loadedId) {
        setLoadedLayoutId(loadedId);
      }
    } catch {
      // Invalid JSON, start fresh
      setLayouts([]);
    }
  }, []);

  // Sync to localStorage whenever layouts change
  const syncToStorage = useCallback((newLayouts: SavedLayout[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newLayouts));
    setLayouts(newLayouts);
  }, []);

  // Check if a name already exists (optionally exclude a specific layout)
  const isNameTaken = useCallback(
    (name: string, excludeId?: string) => {
      const trimmed = name.trim().toLowerCase();
      return layouts.some(
        (l) => l.title.toLowerCase() === trimmed && l.id !== excludeId,
      );
    },
    [layouts],
  );

  // Check if current config is already saved (exact match)
  // Returns null if user has "detached" from viewing saved layouts
  const existingLayoutForCurrentConfig = useMemo(() => {
    if (isDetached) return null;
    return layouts.find((l) => l.url === currentUrl) || null;
  }, [layouts, currentUrl, isDetached]);

  // The layout that was loaded (if any)
  const loadedLayout = useMemo(() => {
    return layouts.find((l) => l.id === loadedLayoutId) || null;
  }, [layouts, loadedLayoutId]);

  // Check if current config has diverged from loaded layout
  const hasUnsavedChanges = useMemo(() => {
    if (!loadedLayout) return false;
    return currentUrl !== loadedLayout.url;
  }, [loadedLayout, currentUrl]);

  const save = useCallback(
    (title: string): { success: boolean; error?: string } => {
      const trimmedTitle = title.trim();

      // Validate name not taken
      if (isNameTaken(trimmedTitle)) {
        return {
          success: false,
          error: 'A layout with this name already exists',
        };
      }

      // Check if config already saved
      const existingConfig = layouts.find((l) => l.url === currentUrl);
      if (existingConfig) {
        return {
          success: false,
          error: `This configuration is already saved as "${existingConfig.title}"`,
        };
      }

      const layout: SavedLayout = {
        id: crypto.randomUUID(),
        title: trimmedTitle || 'Untitled Layout',
        url: currentUrl,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      syncToStorage([...layouts, layout]);
      // Track this as the loaded layout
      setLoadedLayoutId(layout.id);
      sessionStorage.setItem(LOADED_LAYOUT_KEY, layout.id);
      return { success: true };
    },
    [layouts, currentUrl, syncToStorage, isNameTaken],
  );

  // Update an existing layout with current config
  const update = useCallback(
    (id: string): { success: boolean; error?: string } => {
      // Check if this exact config is already saved elsewhere
      const existingConfig = layouts.find(
        (l) => l.url === currentUrl && l.id !== id,
      );
      if (existingConfig) {
        return {
          success: false,
          error: `This configuration is already saved as "${existingConfig.title}"`,
        };
      }

      const updatedLayouts = layouts.map((l) =>
        l.id === id ? { ...l, url: currentUrl, updatedAt: Date.now() } : l,
      );
      syncToStorage(updatedLayouts);
      return { success: true };
    },
    [layouts, currentUrl, syncToStorage],
  );

  // Rename a layout
  const rename = useCallback(
    (id: string, newTitle: string): { success: boolean; error?: string } => {
      const trimmedTitle = newTitle.trim();

      if (!trimmedTitle) {
        return { success: false, error: 'Name cannot be empty' };
      }

      if (isNameTaken(trimmedTitle, id)) {
        return {
          success: false,
          error: 'A layout with this name already exists',
        };
      }

      const updatedLayouts = layouts.map((l) =>
        l.id === id ? { ...l, title: trimmedTitle, updatedAt: Date.now() } : l,
      );
      syncToStorage(updatedLayouts);
      return { success: true };
    },
    [layouts, syncToStorage, isNameTaken],
  );

  const remove = useCallback(
    (id: string) => {
      syncToStorage(layouts.filter((l) => l.id !== id));
      // Clear loaded layout if it was deleted
      if (loadedLayoutId === id) {
        setLoadedLayoutId(null);
        sessionStorage.removeItem(LOADED_LAYOUT_KEY);
      }
    },
    [layouts, syncToStorage, loadedLayoutId],
  );

  const load = useCallback((layout: SavedLayout) => {
    // Track which layout we're loading
    setLoadedLayoutId(layout.id);
    setIsDetached(false);
    sessionStorage.setItem(LOADED_LAYOUT_KEY, layout.id);
    // Navigate to the saved URL
    window.location.search = layout.url;
  }, []);

  // Start fresh - detach from any saved layout view
  const startFresh = useCallback(() => {
    setLoadedLayoutId(null);
    setIsDetached(true);
    sessionStorage.removeItem(LOADED_LAYOUT_KEY);
  }, []);

  return {
    layouts,
    save,
    update,
    rename,
    remove,
    load,
    startFresh,
    isNameTaken,
    existingLayoutForCurrentConfig,
    loadedLayout,
    hasUnsavedChanges,
  };
}

export type UseSavedLayoutsReturn = ReturnType<typeof useSavedLayouts>;
