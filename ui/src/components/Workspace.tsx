import { Splitter, SplitterPanel } from 'primereact/splitter';
import type { TreeNode } from 'primereact/treenode';

import type { Section, SessionSettings } from "../types/session";
import ConfigurationPanel from './ConfigurationPanel';
import LibraryPanel from './LibraryPanel';
import PlaylistPanel from './PlaylistPanel/PlaylistPanel';

interface WorkspaceProps {
    settings: SessionSettings;
    onSettingChange: (field: keyof SessionSettings, value: any) => void;
    refreshTrigger: number;
    libraryNodes: TreeNode[];
    isLibraryLoading: boolean;
    onLibraryRefresh: () => void;
    sections: Section[];
    setSections: (sections: Section[]) => void;
}

export default function Workspace(props: WorkspaceProps) {
    const {
        settings, onSettingChange, refreshTrigger,
        libraryNodes, isLibraryLoading, onLibraryRefresh,
        sections, setSections
    } = props;
    return (
        <div className="flex-grow-1 overflow-hidden p-2 h-full">
            <Splitter
                style={{ height: '100%' }}
                gutterSize={8}
                className="border-none bg-transparent"
            >
                <SplitterPanel size={25} minSize={20} className="flex overflow-hidden border-round-sm">
                    <ConfigurationPanel
                        settings={settings}
                        onChange={onSettingChange}
                        refreshTrigger={refreshTrigger}
                    />
                </SplitterPanel>

                <SplitterPanel size={30} minSize={20} className="flex overflow-hidden border-round-sm">
                    <LibraryPanel
                        nodes={libraryNodes}
                        loading={isLibraryLoading}
                        onRefresh={onLibraryRefresh}
                    />
                </SplitterPanel>

                <SplitterPanel size={45} minSize={20} className="flex overflow-hidden border-round-sm">
                    <PlaylistPanel
                        sections={sections}
                        setSections={setSections}
                        settings={settings}
                    />
                </SplitterPanel>
            </Splitter>
        </div>
    );
}