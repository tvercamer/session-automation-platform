import { handleQuit, handleHelp, handleToggleDev, handleFullScreen } from './utils/electron-bridge.ts';
import SettingsDialog from "./components/SettingsDialog.tsx";
import ConsolePanel from './components/ConsolePanel';
import { useState, useEffect, useRef } from 'react';
import type { TreeNode } from 'primereact/treenode';
import Workspace from "./components/Workspace.tsx";
import type {Section, SessionSettings} from "./types/session.ts";
import AppMenu from "./components/AppMenu.tsx";
import { Toast } from 'primereact/toast';


export default function App() {
    /* ------------------------------------------------------------------------------------
     * STATE MANAGEMENT
     * --------------------------------------------------------------------------------- */

    // ----- VIEWS
    const toast = useRef<Toast>(null);
    const [isSettingsVisible, setIsSettingsVisible] = useState(false);
    const handleSettings = () => {
        setIsSettingsVisible(true);
    };

    // ----- Session Settings
    const [sessionSettings, setSessionSettings] = useState({
        sessionName: '',
        customer: '',
        date: new Date(Date.now() + 14*24*60*60*1000), // Default +14 days
        industry: 'Generic',
        language: 'EN'
    });
    const handleSessionSettingsChange = (field: keyof SessionSettings, value: any) => {
        setSessionSettings(prev => ({ ...prev, [field]: value }));
    };

    // ----- Library Settings
    const [libraryNodes, setLibraryNodes] = useState<TreeNode[]>([]);
    const loadLibrary = async () => {
        try {
            console.log("Fetching library...");
            const data = await window.electronAPI.getLibrary();
            console.log("Library data received:", data);

            // If backend returns an error object (like "path not found"), it will still be a valid array
            setLibraryNodes(data);
        } catch (e) {
            console.error("Failed to load library", e);
        }
    };
    useEffect(() => {
        loadLibrary().then()
    }, [])

    // ----- Playlist Settings
    const [sections, setSections] = useState<Section[]>([]);

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
                sections={sections}
                setSections={setSections}
            />

            <ConsolePanel />
        </div>
    );
}