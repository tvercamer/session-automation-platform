import { handleQuit, handleHelp, handleToggleDev, handleFullScreen } from './utils/electron-bridge.ts';
import SettingsDialog from "./components/SettingsDialog.tsx";
import ConsolePanel from './components/ConsolePanel';
import { useState, useEffect, useRef } from 'react';
import type { TreeNode } from 'primereact/treenode';
import Workspace from "./components/Workspace.tsx";
import type { Section, SessionSettings } from "./types/session.ts";
import AppMenu from "./components/AppMenu.tsx";
import { Toast } from 'primereact/toast';

export default function App() {
    /* ------------------------------------------------------------------------------------
     * STATE MANAGEMENT
     * --------------------------------------------------------------------------------- */

    const toast = useRef<Toast>(null);

    // ----- VIEWS
    const [isSettingsVisible, setIsSettingsVisible] = useState(false);
    const handleSettings = () => {
        setIsSettingsVisible(true);
    };

    // ----- Session Settings
    const [sessionSettings, setSessionSettings] = useState<SessionSettings>({
        sessionName: '',
        customer: null,
        date: new Date(Date.now() + 14*24*60*60*1000), // Default +14 days
        industry: null,
        language: null
    });

    const handleSessionSettingsChange = (field: keyof SessionSettings, value: any) => {
        setSessionSettings(prev => ({ ...prev, [field]: value }));
    };

    // ----- Library Settings
    const [libraryNodes, setLibraryNodes] = useState<TreeNode[]>([]);
    const [isLibraryLoading, setIsLibraryLoading] = useState(false);

    const loadLibrary = async () => {
        setIsLibraryLoading(true);
        try {
            console.log("Fetching library...");
            const data = await window.electronAPI.getLibrary();
            console.log("Library data received:", data);
            setLibraryNodes(data);
        } catch (e) {
            console.error("Failed to load library", e);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Could not refresh library.'
            });
        } finally {
            setIsLibraryLoading(false);
        }
    };

    useEffect(() => {
        loadLibrary();
    }, []);

    // ----- Playlist Settings
    const [sections, setSections] = useState<Section[]>([
        { id: 'intro', title: 'Introduction', isLocked: true, items: [] },
        { id: 'outro', title: 'Outro', isLocked: true, items: [] }
    ]);

    /* ------------------------------------------------------------------------------------
     * RENDERING
     * --------------------------------------------------------------------------------- */
    return (
        <div className='flex flex-column h-screen overflow-hidden text-white'>
            <Toast ref={toast} />

            <SettingsDialog
                visible={isSettingsVisible}
                onHide={() => setIsSettingsVisible(false)}
                onSettingsChanged={loadLibrary}
            />

            <AppMenu
                onSettings={handleSettings}
                onQuit={handleQuit}
                onFullScreen={handleFullScreen}
                onToggleDev={handleToggleDev}
                onHelp={handleHelp}
            />

            <Workspace
                settings={sessionSettings}
                onSettingChange={handleSessionSettingsChange}
                libraryNodes={libraryNodes}
                isLibraryLoading={isLibraryLoading} // Nieuw: Geef loading state door
                onLibraryRefresh={loadLibrary}      // Nieuw: Geef refresh functie door
                sections={sections}
                setSections={setSections}
            />

            <ConsolePanel />
        </div>
    );
}