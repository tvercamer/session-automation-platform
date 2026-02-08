import { useState } from 'react';
import type { TreeNode } from 'primereact/treenode';
import { Menubar } from 'primereact/menubar';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import type { MenuItem } from 'primereact/menuitem';

import ConfigurationPanel from './components/ConfigurationPanel';
import LibraryPanel from './components/LibraryPanel';
import PlaylistPanel from './components/PlaylistPanel';
import ConsolePanel from './components/ConsolePanel';

// Define the types locally so App knows the structure
export interface FileItem {
    id: string;
    name: string;
    type: 'file';
    fileType: string;
}

export interface Section {
    id: string;
    title: string;
    isLocked: boolean;
    items: FileItem[];
}

export default function App() {
    // --- STATE MANAGEMENT ---
    const [sessionName, setSessionName] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [date, setDate] = useState<Date | null | undefined>(new Date(Date.now() + 14*24*60*60*1000)); // Default +14 days
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

    // --- LIBRARY DATA ---
    // Note: No icons here, so the LibraryPanel template handles the folder/file icons dynamically
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

    // --- PLAYLIST STATE (New Nested Structure) ---
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
            id: 'concl',
            title: 'Conclusion',
            isLocked: true,
            items: [] // Empty locked end
        }
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
                        {/* Updated to pass sections instead of flat items */}
                        <PlaylistPanel sections={sections} setSections={setSections} />
                    </SplitterPanel>

                </Splitter>
            </div>

            <ConsolePanel />
        </div>
    );
}