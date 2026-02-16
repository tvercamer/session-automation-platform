import React from 'react';
import { Tree } from 'primereact/tree';
import { Button } from 'primereact/button';
import type { TreeNode } from 'primereact/treenode';

interface LibraryPanelProps {
    nodes: TreeNode[];
    onRefresh?: () => void; // Nieuw: Om de refresh te triggeren
    loading?: boolean;      // Nieuw: Om een spinner te tonen tijdens laden
}

export default function LibraryPanel({ nodes, onRefresh, loading = false }: LibraryPanelProps) {
    const handleDragStart = (e: React.DragEvent, node: TreeNode) => {
        // We sturen de volledige node data mee voor de playlist logic
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
                <span className="text-gray-300 text-sm">{node.label}</span>
            </div>
        );
    };

    return (
        <div className="flex-1 surface-ground flex flex-column h-full overflow-hidden border-right-1 surface-border">
            {/* HEADER met Refresh Knop */}
            <div className="flex align-items-center justify-content-between p-2 px-3 bg-header" style={{ height: '3rem' }}>
                <span className="font-bold text-sm text-gray-200">Library</span>
                <Button
                    icon={loading ? "pi pi-spin pi-spinner" : "pi pi-refresh"}
                    onClick={onRefresh}
                    disabled={loading}
                    className="p-button-text p-button-secondary p-button-sm w-2rem h-2rem text-gray-400 hover:text-white"
                    tooltip="Refresh Library"
                    tooltipOptions={{ position: 'bottom' }}
                />
            </div>

            {/* TREE AREA */}
            <div className="flex-grow-1 overflow-y-auto custom-scrollbar p-2">
                {nodes.length === 0 && !loading ? (
                    <div className="text-center p-4 text-gray-500 text-xs italic">
                        No files found or library path not set.
                    </div>
                ) : (
                    <Tree
                        value={nodes}
                        className="w-full border-none bg-transparent p-0 m-0"
                        contentClassName="p-1"
                        nodeTemplate={nodeTemplate}
                        dragdropScope="library-item"
                    />
                )}
            </div>
        </div>
    );
}