import React from 'react';
import { Tree } from 'primereact/tree';
import type { TreeNode } from 'primereact/treenode';

interface LibraryPanelProps {
    nodes: TreeNode[];
}

export default function LibraryPanel({ nodes }: LibraryPanelProps) {
    const handleDragStart = (e: React.DragEvent, node: TreeNode) => {
        e.dataTransfer.setData('application/json', JSON.stringify(node));
        e.dataTransfer.effectAllowed = 'copy';
    };

    const nodeTemplate = (node: TreeNode, options: any) => {
        let iconClass = node.icon;

        if (node.children && node.children.length > 0) {
            iconClass = options.expanded ? 'pi pi-folder-open text-yellow-500' : 'pi pi-folder text-yellow-500';
        } else if (!iconClass) {
            iconClass = 'pi pi-file text-gray-400';
        }

        return (
            <div
                className="flex align-items-center w-full cursor-pointer hover:text-white"
                draggable="true"
                onDragStart={(e) => handleDragStart(e, node)}
            >
                <i className={`${iconClass} mr-2`}></i>
                <span className="text-gray-300">{node.label}</span>
            </div>
        );
    };

    return (
        <div className="flex-1 surface-ground flex flex-column h-full">
            <div className="flex align-items-center p-2 px-3 bg-header" style={{ height: '3rem' }}>
                <span className="font-bold text-sm text-gray-200">Library</span>
            </div>

            <div className="flex-grow-1 overflow-y-auto custom-scrollbar p-2">
                <Tree
                    value={nodes}
                    className="w-full border-none bg-transparent p-0 m-0 text-sm"
                    contentClassName="p-1"
                    nodeTemplate={nodeTemplate}
                    dragdropScope="library-item"
                />
            </div>
        </div>
    );
}