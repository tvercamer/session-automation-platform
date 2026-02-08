import React from 'react';
import { OrderList } from 'primereact/orderlist';
import { Button } from 'primereact/button';

interface PlaylistPanelProps {
    items: any[];
    setItems: (val: any[]) => void;
}

export default function PlaylistPanel(props: PlaylistPanelProps) {
    const { items, setItems } = props;

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        try {
            const json = e.dataTransfer.getData('application/json');
            if (!json) return;

            const node = JSON.parse(json);

            const newItem = {
                id: Math.random().toString(36).substr(2, 9),
                name: node.label,
                type: 'file',
                fileType: 'word'
            };

            setItems([...items, newItem]);
        } catch (err) {
            console.error("Drop failed", err);
        }
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const getFileIcon = (fileType: string) => {
        switch (fileType) {
            case 'word': return <i className="pi pi-file-word text-blue-500 text-xl"></i>;
            case 'excel': return <i className="pi pi-file-excel text-green-500 text-xl"></i>;
            default: return <i className="pi pi-file text-gray-400 text-xl"></i>;
        }
    };

    const itemTemplate = (item: any) => {
        if (item.type === 'file') {
            return (
                <div className="flex align-items-center p-2 w-full surface-card border-1 surface-border border-round hover:surface-hover cursor-move transition-colors mb-2">
                    <div className="flex align-items-center justify-content-center w-2rem mr-3">
                        {getFileIcon(item.fileType)}
                    </div>
                    <div className="flex flex-column flex-grow-1">
                        <span className="text-gray-500 text-xs mb-1 uppercase font-bold" style={{fontSize: '0.65rem'}}>Exercise</span>
                        <span className="font-medium text-sm text-gray-200">{item.name}</span>
                    </div>
                    <Button icon="pi pi-times" rounded text severity="secondary" className="h-2rem w-2rem text-gray-500 hover:text-white" />
                </div>
            );
        }
        return (
            <div className="flex align-items-center py-3 px-2 w-full cursor-move border-bottom-1 surface-border mb-1">
                <span className="font-bold text-base text-white">{item.name}</span>
            </div>
        );
    };

    return (
        <div
            className="flex-1 surface-ground flex flex-column h-full"
            onDrop={onDrop}
            onDragOver={onDragOver}
        >
            <div className="flex align-items-center justify-content-between p-2 px-3 bg-header" style={{ height: '3rem' }}>
                <span className="font-bold text-sm text-gray-200">Session Topics</span>
                <div className="flex gap-1">
                    <Button icon="pi pi-save" rounded text severity="secondary" className="w-2rem h-2rem text-gray-400 hover:text-white"/>
                    <Button icon="pi pi-folder-open" rounded text severity="secondary" className="w-2rem h-2rem text-gray-400 hover:text-white"/>
                    <Button icon="pi pi-trash" rounded text severity="danger" className="w-2rem h-2rem text-gray-400 hover:text-red-500"/>
                </div>
            </div>

            <div className="flex-grow-1 overflow-y-auto p-3">
                <div className="text-xs text-gray-500 mb-3 ml-1">
                    Drag items here from Library...
                </div>
                <OrderList
                    dataKey="id"
                    value={items}
                    onChange={(e) => setItems(e.value)}
                    itemTemplate={itemTemplate}
                    dragdrop
                    className="w-full"
                />
            </div>
        </div>
    );
}