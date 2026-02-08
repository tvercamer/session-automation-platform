import { useEffect } from 'react';
import { Menubar } from 'primereact/menubar';
import type { MenuItem } from 'primereact/menuitem';

interface CustomMenuItem extends Omit<MenuItem, 'items'> {
    shortcut?: string;
    items?: CustomMenuItem[]; // Re-define strictly as 1D array of our custom type
}

interface AppMenuProps {
    onSettings: () => void;
    onQuit: () => void;
    onFullScreen: () => void;
    onToggleDev: () => void;
    onHelp: () => void;
}

export default function AppMenu(props: AppMenuProps) {
    const { onSettings, onQuit, onFullScreen, onToggleDev, onHelp } = props;

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.altKey) {
                switch (e.key.toLowerCase()) {
                    case ',': e.preventDefault(); onSettings(); break;
                    case 'q': e.preventDefault(); onQuit(); break;
                    case 'f': e.preventDefault(); onFullScreen(); break;
                    case 'd': e.preventDefault(); onToggleDev(); break;
                    case 'h': e.preventDefault(); onHelp(); break;
                    default: break;
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onSettings, onQuit, onFullScreen, onToggleDev, onHelp]);

    const itemRenderer = (item: MenuItem) => {
        const customItem = item as CustomMenuItem;

        return (
            <a
                className="flex align-items-center p-menuitem-link w-full"
                onClick={(e) => item.command?.({ originalEvent: e, item })}
            >
                <span className={`p-menuitem-icon ${item.icon}`} />
                <span className="p-menuitem-text">{item.label}</span>
                {customItem.shortcut && (
                    <span className="ml-auto text-xs text-gray-400 pl-4">{customItem.shortcut}</span>
                )}
            </a>
        );
    };

    const items: CustomMenuItem[] = [
        {
            label: 'File',
            items: [
                {
                    label: 'Settings',
                    icon: 'pi pi-cog',
                    shortcut: 'Alt+,',
                    command: onSettings,
                    template: itemRenderer
                },
                { separator: true },
                {
                    label: 'Quit',
                    icon: 'pi pi-power-off',
                    shortcut: 'Alt+Q',
                    command: onQuit,
                    template: itemRenderer
                }
            ]
        },
        {
            label: 'View',
            items: [
                {
                    label: 'Full Screen',
                    icon: 'pi pi-window-maximize',
                    shortcut: 'Alt+F',
                    command: onFullScreen,
                    template: itemRenderer
                },
                {
                    label: 'Toggle Dev View',
                    icon: 'pi pi-eye',
                    shortcut: 'Alt+D',
                    command: onToggleDev,
                    template: itemRenderer
                }
            ]
        },
        {
            label: 'Help',
            command: onHelp,
            shortcut: 'Alt+H',
        }
    ];

    return (
        <Menubar model={items as any} className="border-none bg-surface-ground" />
    );
}