import React from 'react';
import { Tree } from 'primereact/tree';
import { Button } from 'primereact/button';
import type { TreeNode } from 'primereact/treenode';

interface LibraryPanelProps {
    nodes: TreeNode[];
    onRefresh: () => void;
    loading?: boolean;
}

export default function LibraryPanel({ nodes, onRefresh, loading = false }: LibraryPanelProps) {

    const handleDragStart = (e: React.DragEvent, node: TreeNode) => {
        // Serialize node data to transfer it to the PlaylistPanel
        // We ensure we pass the full node data (path, type, etc.)
        e.dataTransfer.setData('application/json', JSON.stringify(node.data));
        e.dataTransfer.effectAllowed = 'copy';
    };

    const nodeTemplate = (node: TreeNode, options: any) => {
        let iconClass = node.icon || 'pi pi-file text-gray-400';

        if (node.children && node.children.length > 0) {
            iconClass = options.expanded ? 'pi pi-folder-open text-yellow-500' : 'pi pi-folder text-yellow-500';
        }

        return (
            <div
                className="flex align-items-center w-full cursor-pointer hover:text-white transition-colors transition-duration-150"
                draggable={!node.children} // Files are draggable
                onDragStart={(e) => !node.children && handleDragStart(e, node)}
            >
                <i className={`${iconClass} mr-2`}></i>
                <span className="text-gray-300 text-sm select-none">{node.label}</span>
            </div>
        );
    };

    return (
        <div className="flex-1 surface-ground flex flex-column h-full overflow-hidden">

            {/* HEADER */}
            <div className="flex align-items-center justify-content-between p-2 px-3 bg-header" style={{ height: '3rem' }}>
                <div className="flex align-items-center gap-2">
                    <span className="font-bold text-sm text-gray-200">Library</span>
                </div>

                <Button
                    icon={loading ? "pi pi-spin pi-spinner" : "pi pi-refresh"}
                    onClick={onRefresh}
                    disabled={loading}
                    text
                    rounded
                    className="h-2rem w-2rem text-gray-400 hover:text-white"
                    tooltip="Refresh Library"
                    tooltipOptions={{ position: 'bottom' }}
                />
            </div>

            {/* TREE AREA */}
            <div className="flex-grow-1 overflow-y-auto custom-scrollbar p-2">
                {nodes.length === 0 && !loading ? (
                    <div className="text-center p-4 text-gray-500 text-xs italic select-none">
                        No files found or library path not set.
                    </div>
                ) : (
                    <Tree
                        value={nodes}
                        className="w-full border-none bg-transparent p-0 m-0 text-sm"
                        contentClassName="p-0"
                        nodeTemplate={nodeTemplate}
                    />
                )}
            </div>
        </div>
    );
}