import { useEffect } from 'react';

interface ShortcutOptions {
  ctrlOrCmd?: boolean;
  shift?: boolean;
  alt?: boolean;
}

export function useKeyboardShortcut(
  key: string,
  callback: (e: KeyboardEvent) => void,
  options: ShortcutOptions = {}
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (options.ctrlOrCmd) {
        if (!e.ctrlKey && !e.metaKey) return;
      }
      if (options.shift && !e.shiftKey) return;
      if (options.alt && !e.altKey) return;

      if (e.key.toLowerCase() === key.toLowerCase()) {
        e.preventDefault();
        callback(e);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [key, callback, options.ctrlOrCmd, options.shift, options.alt]);
}
