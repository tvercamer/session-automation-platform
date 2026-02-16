import type { Section, SessionSettings } from "../types/session.ts";
import { Splitter, SplitterPanel } from 'primereact/splitter';
import PlaylistPanel from "./PlaylistPanel/PlaylistPanel.tsx";
import ConfigurationPanel from './ConfigurationPanel';
import type { TreeNode } from 'primereact/treenode';
import LibraryPanel from './LibraryPanel';

interface WorkspaceProps {
    settings: SessionSettings;
    onSettingChange: (field: keyof SessionSettings, value: any) => void;
    libraryNodes: TreeNode[];
    isLibraryLoading: boolean;      // Nieuw
    onLibraryRefresh: () => void;   // Nieuw
    sections: Section[];
    setSections: (sections: Section[]) => void;
}

export default function Workspace(props: WorkspaceProps) {
    const {
        settings,
        onSettingChange,
        libraryNodes,
        isLibraryLoading,
        onLibraryRefresh,
        sections,
        setSections
    } = props;

    return(
        <div className="flex-grow-1 overflow-hidden p-2">
            <Splitter style={{ height: '100%', border: 'none', background: 'transparent' }} gutterSize={8}>

                {/* LINKS: Configuratie (Klant, Datum, etc.) */}
                <SplitterPanel size={25} minSize={20} className="flex overflow-hidden border-round-sm">
                    <ConfigurationPanel
                        settings={settings}
                        onChange={onSettingChange}
                    />
                </SplitterPanel>

                {/* MIDDEN: Library met Refresh functionaliteit */}
                <SplitterPanel size={30} minSize={20} className="flex overflow-hidden border-round-sm">
                    <LibraryPanel
                        nodes={libraryNodes}
                        loading={isLibraryLoading}
                        onRefresh={onLibraryRefresh}
                    />
                </SplitterPanel>

                {/* RECHTS: Playlist (Sessiebruwer) */}
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