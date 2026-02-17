import { Menubar } from 'primereact/menubar';
import type { MenuItem } from 'primereact/menuitem';
import { useShortcuts } from '../hooks/useShortcuts';

interface AppMenuProps {
    onSettings: () => void;
    onQuit: () => void;
    onFullScreen: () => void;
    onToggleDev: () => void;
    onHelp: () => void;
}

export default function AppMenu({
                                    onSettings,
                                    onQuit,
                                    onFullScreen,
                                    onToggleDev,
                                    onHelp
                                }: AppMenuProps) {

    // Initialize global shortcuts via custom hook
    useShortcuts({
        ',': onSettings,
        'q': onQuit,
        'f': onFullScreen,
        'd': onToggleDev,
        'h': onHelp
    });

    /**
     * Custom renderer to display shortcut labels in the menu items
     */
    const itemRenderer = (item: MenuItem) => {
        return (
            <a
                className="flex align-items-center p-menuitem-link w-full"
                onClick={(e) => item.command?.({ originalEvent: e, item })}
            >
                <span className={`p-menuitem-icon ${item.icon}`} />
                <span className="p-menuitem-text">{item.label}</span>
                {item.data?.shortcut && (
                    <span className="ml-auto text-xs text-gray-400 pl-4">
                        {item.data.shortcut}
                    </span>
                )}
            </a>
        );
    };

    const items: MenuItem[] = [
        {
            label: 'File',
            items: [
                {
                    label: 'Settings',
                    icon: 'pi pi-cog',
                    command: onSettings,
                    template: itemRenderer,
                    data: { shortcut: 'Alt+,' }
                },
                { separator: true },
                {
                    label: 'Quit',
                    icon: 'pi pi-power-off',
                    command: onQuit,
                    template: itemRenderer,
                    data: { shortcut: 'Alt+Q' }
                }
            ]
        },
        {
            label: 'View',
            items: [
                {
                    label: 'Full Screen',
                    icon: 'pi pi-window-maximize',
                    command: onFullScreen,
                    template: itemRenderer,
                    data: { shortcut: 'Alt+F' }
                },
                {
                    label: 'Toggle Dev View',
                    icon: 'pi pi-eye',
                    command: onToggleDev,
                    template: itemRenderer,
                    data: { shortcut: 'Alt+D' }
                }
            ]
        },
        {
            label: 'Help',
            command: onHelp,
            template: itemRenderer,
        }
    ];

    return (
        <Menubar model={items} className="border-none bg-surface-ground px-2 py-1" />
    );
}