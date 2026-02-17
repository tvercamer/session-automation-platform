import { useState, useEffect, useRef } from 'react';
import { Toast } from 'primereact/toast';
import type { TreeNode } from 'primereact/treenode';

// Components
import AppMenu from "./components/AppMenu";
import Workspace from "./components/Workspace";
import ConsolePanel from './components/ConsolePanel/ConsolePanel';
import SettingsDialog from "./components/Settings/SettingsDialog";

// Utils & Types
import { handleQuit, handleHelp, handleToggleDev, handleFullScreen } from './utils/electron-bridge';
import type { Section, SessionSettings } from "./types/session";

export default function App() {
    /* ------------------------------------------------------------------------------------
     * STATE
     * --------------------------------------------------------------------------------- */
    const toast = useRef<Toast>(null);

    // UI State
    const [isSettingsVisible, setIsSettingsVisible] = useState(false);
    const [isLibraryLoading, setIsLibraryLoading] = useState(false);

    // Data Versioning (Triggers re-fetches in children)
    const [configRefreshTrigger, setConfigRefreshTrigger] = useState(0);

    // Session Data
    const [libraryNodes, setLibraryNodes] = useState<TreeNode[]>([]);
    const [sections, setSections] = useState<Section[]>([
        { id: 'intro', title: 'Introduction', isLocked: true, items: [] },
        { id: 'outro', title: 'Outro', isLocked: true, items: [] }
    ]);

    // Configuration Data
    const [sessionSettings, setSessionSettings] = useState<SessionSettings>({
        sessionName: '',
        customer: null,
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Default: +14 days
        industry: null,
        language: null
    });

    /* ------------------------------------------------------------------------------------
     * LOGIC
     * --------------------------------------------------------------------------------- */

    const loadLibrary = async () => {
        setIsLibraryLoading(true);
        try {
            const data = await window.electronAPI.getLibrary();
            setLibraryNodes(data);
        } catch (e) {
            console.error("Failed to load library", e);
            toast.current?.show({
                severity: 'error',
                summary: 'Library Error',
                detail: 'Could not refresh library files. Check your settings path.'
            });
        } finally {
            setIsLibraryLoading(false);
        }
    };

    // Initial Load
    useEffect(() => {
        loadLibrary();
    }, []);

    const handleSessionSettingsChange = (field: keyof SessionSettings, value: any) => {
        setSessionSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleSettingsSaved = () => {
        loadLibrary().then();
        setConfigRefreshTrigger(prev => prev + 1);
    };

    /* ------------------------------------------------------------------------------------
     * RENDER
     * --------------------------------------------------------------------------------- */
    return (
        <div className='flex flex-column h-screen overflow-hidden surface-ground text-gray-200 font-sans'>
            <Toast ref={toast} />

            <SettingsDialog
                visible={isSettingsVisible}
                onHide={() => setIsSettingsVisible(false)}
                onSettingsChanged={handleSettingsSaved}
            />

            <AppMenu
                onSettings={() => setIsSettingsVisible(true)}
                onQuit={handleQuit}
                onFullScreen={handleFullScreen}
                onToggleDev={handleToggleDev}
                onHelp={handleHelp}
            />

            <Workspace
                // Configuration Props
                settings={sessionSettings}
                onSettingChange={handleSessionSettingsChange}
                refreshTrigger={configRefreshTrigger}

                // Library Props
                libraryNodes={libraryNodes}
                isLibraryLoading={isLibraryLoading}
                onLibraryRefresh={loadLibrary}

                // Playlist Props
                sections={sections}
                setSections={setSections}
            />

            <ConsolePanel />
        </div>
    );
}