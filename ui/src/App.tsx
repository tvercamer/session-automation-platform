import { useState, useRef } from 'react';
import type { TreeNode } from 'primereact/treenode';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import { Toast } from 'primereact/toast';
import AppMenu from "./components/AppMenu.tsx";
import SettingsDialog from "./components/SettingsDialog.tsx";
import ConfigurationPanel from './components/ConfigurationPanel';
import LibraryPanel from './components/LibraryPanel';
import PlaylistPanel from './components/PlaylistPanel/PlaylistPanel.tsx';
import ConsolePanel from './components/ConsolePanel';
import type { Section } from "./types/session.ts";

export default function App() {
    const toast = useRef<Toast>(null);

    // --- STATE MANAGEMENT ---
    const [isSettingsVisible, setIsSettingsVisible] = useState(false);
    const [sessionName, setSessionName] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [date, setDate] = useState<Date | null | undefined>(new Date(Date.now() + 14*24*60*60*1000)); // Default +14 days
    const [selectedIndustry, setSelectedIndustry] = useState(null);
    const [selectedLanguage, setSelectedLanguage] = useState(null);
    const [sections, setSections] = useState<Section[]>([
        {
            id: 'intro',
            title: 'Introduction',
            isLocked: true,
            items: [] // Empty locked start
        },
        {
            id: 'sec1',
            title: 'Market Overview',
            isLocked: false,
            items: [
                { id: 'f1', name: 'Competitor_Analysis.docx', type: 'file', fileType: 'word' }
            ]
        },
        {
            id: 'sec2',
            title: 'Financials',
            isLocked: false,
            items: [
                { id: 'f2', name: 'Budget_Template.xlsx', type: 'file', fileType: 'excel' }
            ]
        },
        {
            id: 'outro',
            title: 'Outro',
            isLocked: true,
            items: [] // Empty locked end
        }
    ]);
    const [treeNodes] = useState<TreeNode[]>([
        {
            key: '0',
            label: 'Topics',
            children: [
                { key: '0-0', label: 'Introduction' },
                { key: '0-1', label: 'Market Overview' }
            ]
        },
        {
            key: '1',
            label: 'Templates',
            children: [
                { key: '1-0', label: 'Images.ppt' }
            ]
        }
    ]);

    // --- ACTIONS ---
    const handleSettings = () => {
        setIsSettingsVisible(true);
    };

    const handleQuit = () => {
        window.electronAPI.quitApp();
    };

    const handleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then();
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().then();
            }
        }
    };

    const handleToggleDev = () => {
        window.electronAPI.toggleDevTools();
    };

    const handleHelp = () => {
        window.electronAPI.help();
    }

    // --- RENDER ---
    return (
        <div className='flex flex-column h-screen overflow-hidden text-white'>
            <Toast ref={toast} />

            <SettingsDialog
                visible={isSettingsVisible}
                onHide={() => setIsSettingsVisible(false)}
            />

            <AppMenu
                onSettings={handleSettings}
                onQuit={handleQuit}
                onFullScreen={handleFullScreen}
                onToggleDev={handleToggleDev}
                onHelp={handleHelp}
            />

            <div className="flex-grow-1 overflow-hidden p-2">
                <Splitter
                    style={{ height: '100%', border: 'none', background: 'transparent' }}
                    gutterSize={8}
                >

                    <SplitterPanel size={25} minSize={20} className="flex overflow-hidden border-round-sm">
                        <ConfigurationPanel
                            sessionName={sessionName} setSessionName={setSessionName}
                            selectedCustomer={selectedCustomer} setSelectedCustomer={setSelectedCustomer}
                            date={date} setDate={setDate}
                            selectedIndustry={selectedIndustry} setSelectedIndustry={setSelectedIndustry}
                            selectedLanguage={selectedLanguage} setSelectedLanguage={setSelectedLanguage}
                        />
                    </SplitterPanel>

                    <SplitterPanel size={35} minSize={20} className="flex overflow-hidden border-round-sm">
                        <LibraryPanel nodes={treeNodes} />
                    </SplitterPanel>

                    <SplitterPanel size={40} minSize={20} className="flex overflow-hidden border-round-sm">
                        <PlaylistPanel sections={sections} setSections={setSections} />
                    </SplitterPanel>

                </Splitter>
            </div>

            <ConsolePanel />
        </div>
    );
}