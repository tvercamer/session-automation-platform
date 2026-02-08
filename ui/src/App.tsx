import { useState } from 'react';
import type { TreeNode } from 'primereact/treenode';
import { Menubar } from 'primereact/menubar';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import type { MenuItem } from 'primereact/menuitem';
import ConfigurationPanel from './components/ConfigurationPanel';
import LibraryPanel from './components/LibraryPanel';
import PlaylistPanel from './components/PlaylistPanel';
import ConsolePanel from './components/ConsolePanel';

export default function App() {
    // --- STATE MANAGEMENT ---
    const [sessionName, setSessionName] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [date, setDate] = useState<Date | null | undefined>(new Date(Date.now() + 14*24*60*60*1000)); // Default to 2 weeks from now
    const [selectedIndustry, setSelectedIndustry] = useState(null);
    const [selectedLanguage, setSelectedLanguage] = useState(null);

    // --- MENU ---
    const menuItems: MenuItem[] = [
        { label: 'File', items: [{ label: 'New' }, { label: 'Open' }, { label: 'Exit' }] },
        { label: 'Edit', items: [{ label: 'Undo' }, { label: 'Redo' }] },
        { label: 'View', items: [{ label: 'Toggle Console' }] },
        { label: 'Settings', icon: 'pi pi-cog' },
        { label: 'Help' }
    ];

    // --- DUMMY LIBRARY DATA ---
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

    const [playlist, setPlaylist] = useState([
        { id: '1', name: 'Introduction', type: 'section' },
        { id: '2', name: 'Market Overview', type: 'section' },
        { id: '3', name: 'Competitor_Analysis.docx', type: 'file', fileType: 'word' },
        { id: '4', name: 'Financials', type: 'section' },
        { id: '5', name: 'Budget_Template.xlsx', type: 'file', fileType: 'excel' },
        { id: '6', name: 'Conclusion', type: 'section' }
    ]);

    return (
        <div className="flex flex-column h-screen overflow-hidden text-white">
            <Menubar model={menuItems} />

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
                        <PlaylistPanel items={playlist} setItems={setPlaylist} />
                    </SplitterPanel>

                </Splitter>
            </div>

            <ConsolePanel />
        </div>
    );
}