import { useState } from 'react';
import type { TreeNode } from 'primereact/treenode';
import ConfigurationPanel from './components/ConfigurationPanel';
import LibraryPanel from './components/LibraryPanel';
import PlaylistPanel from './components/PlaylistPanel';
import ConsolePanel from './components/ConsolePanel';

export default function App() {
    // --- STATE MANAGEMENT ---
    const [sessionName, setSessionName] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [date, setDate] = useState<Date | null | undefined>(null);
    const [selectedIndustry, setSelectedIndustry] = useState(null);
    const [selectedLanguage, setSelectedLanguage] = useState(null);

    // Dummy Library Data
    const [treeNodes] = useState<TreeNode[]>([
        {
            key: '0',
            label: 'Topics',
            children: [
                { key: '0-0', label: 'Introduction', icon: 'pi pi-fw pi-folder' },
                {
                    key: '0-1',
                    label: 'Case Studies',
                    icon: 'pi pi-fw pi-folder',
                    children: [
                        { key: '0-1-0', label: 'Intro Case 1', icon: 'pi pi-fw pi-file' },
                        { key: '0-1-1', label: 'Market Overview', icon: 'pi pi-fw pi-file' }
                    ]
                }
            ]
        },
        {
            key: '1',
            label: 'Templates',
            children: [
                { key: '1-0', label: 'Images.ppt', icon: 'pi pi-fw pi-image' }
            ]
        }
    ]);

    // Dummy Playlist Data
    const [playlist, setPlaylist] = useState([
        { id: '1', name: 'Introduction' },
        { id: '2', name: 'Market Overview' },
        { id: '3', name: 'Financials' },
        { id: '4', name: 'Conclusion' }
    ]);

    return (
        <div className="flex flex-column h-screen p-2 gap-2 surface-ground text-white">
            <div className="flex flex-grow-1 gap-2 overflow-hidden">
                <ConfigurationPanel
                    sessionName={sessionName}
                    setSessionName={setSessionName}
                    selectedCustomer={selectedCustomer}
                    setSelectedCustomer={setSelectedCustomer}
                    date={date}
                    setDate={setDate}
                    selectedIndustry={selectedIndustry}
                    setSelectedIndustry={setSelectedIndustry}
                    selectedLanguage={selectedLanguage}
                    setSelectedLanguage={setSelectedLanguage}
                />

                <LibraryPanel nodes={treeNodes} />

                <PlaylistPanel items={playlist} setItems={setPlaylist} />
            </div>

            <ConsolePanel />

        </div>
    );
}