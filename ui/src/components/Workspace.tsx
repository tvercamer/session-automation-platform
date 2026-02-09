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
    sections: Section[];
    setSections: (sections: Section[]) => void;
}

export default function Workspace(props: WorkspaceProps) {
    const { settings, onSettingChange, libraryNodes, sections, setSections } = props;
    return(
        <div className="flex-grow-1 overflow-hidden p-2">
            <Splitter style={{ height: '100%', border: 'none', background: 'transparent' }} gutterSize={8}>

                <SplitterPanel size={25} minSize={20} className="flex overflow-hidden border-round-sm">
                    <ConfigurationPanel
                        settings={settings}
                        onChange={onSettingChange}
                    />
                </SplitterPanel>

                <SplitterPanel size={35} minSize={20} className="flex overflow-hidden border-round-sm">
                    <LibraryPanel nodes={libraryNodes} />
                </SplitterPanel>

                <SplitterPanel size={40} minSize={20} className="flex overflow-hidden border-round-sm">
                    <PlaylistPanel sections={sections} setSections={setSections} />
                </SplitterPanel>

            </Splitter>
        </div>
    );
}