import { useEffect } from 'react';

/**
 * Custom hook to manage global keyboard shortcuts.
 * Currently supports Alt + [key] combinations.
 */
export const useShortcuts = (actions: Record<string, () => void>) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // We only listen for Alt-key combinations
            if (!e.altKey) return;

            const key = e.key.toLowerCase();
            const action = actions[key];

            if (action) {
                e.preventDefault();
                action();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [actions]);
};