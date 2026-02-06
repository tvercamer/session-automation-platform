import { Tree } from 'primereact/tree';
import type { TreeNode } from 'primereact/treenode';

interface LibraryPanelProps {
    nodes: TreeNode[];
}

export default function LibraryPanel({nodes}: LibraryPanelProps){
    return (
        <div className="flex-1 surface-card border-round p-3 shadow-2 flex flex-column">
            <div className="font-bold text-xl mb-3 border-bottom-1 surface-border pb-2">
                Library
            </div>
            <div className="flex-grow-1 overflow-y-auto border-1 surface-border border-round">
                <Tree value={nodes} className="w-full border-none bg-transparent" />
            </div>
        </div>
    );
}