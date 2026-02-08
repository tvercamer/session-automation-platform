import React, { useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { confirmPopup, ConfirmPopup } from 'primereact/confirmpopup';
import { InputText } from 'primereact/inputtext';

// TYPES
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

interface PlaylistPanelProps {
    sections: Section[];
    setSections: (val: Section[]) => void;
}

export default function PlaylistPanel(props: PlaylistPanelProps) {
    const { sections, setSections } = props;
    const toast = useRef<Toast>(null);

    // Editing State
    const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
    const [tempTitle, setTempTitle] = useState('');

    // Drag & Drop State
    // We track what is being dragged: { type: 'FILE' | 'SECTION', sIdx: sectionIndex, iIdx: itemIndex }
    const dragItem = useRef<any>(null);
    const [dragOverSectionIndex, setDragOverSectionIndex] = useState<number | null>(null);

    // --- DRAG HANDLERS ---

    const handleDragStart = (e: React.DragEvent, type: 'FILE' | 'SECTION', sIdx: number, iIdx?: number) => {
        dragItem.current = { type, sIdx, iIdx };
        // We set effectAllowed to move for internal, but copy is default for cross-window
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, sectionIndex: number) => {
        e.preventDefault();
        // Highlight the section we are dragging over
        setDragOverSectionIndex(sectionIndex);
    };

    const handleDragLeave = () => {
        setDragOverSectionIndex(null);
    };

    const onDrop = (e: React.DragEvent, targetSectionIndex: number) => {
        e.preventDefault();
        setDragOverSectionIndex(null);

        // 1. HANDLE LIBRARY DROP (External JSON)
        const json = e.dataTransfer.getData('application/json');
        if (json && !dragItem.current) {
            try {
                const node = JSON.parse(json);
                const newItem: FileItem = {
                    id: Math.random().toString(36).substr(2, 9),
                    name: node.label,
                    type: 'file',
                    fileType: 'word'
                };
                const updated = [...sections];
                updated[targetSectionIndex].items.push(newItem);
                setSections(updated);
                toast.current?.show({ severity: 'success', summary: 'Added', detail: `${node.label} added` });
            } catch (err) { console.error(err); }
            return;
        }

        // 2. HANDLE INTERNAL FILE MOVE
        if (dragItem.current && dragItem.current.type === 'FILE') {
            const { sIdx: sourceSectionIndex, iIdx: sourceItemIndex } = dragItem.current;

            // Don't do anything if dropping on itself
            if (sourceSectionIndex === targetSectionIndex && sourceItemIndex === undefined) return;

            const updated = [...sections];
            // Remove from source
            const [movedItem] = updated[sourceSectionIndex].items.splice(sourceItemIndex, 1);
            // Add to target (append to end of list for now)
            updated[targetSectionIndex].items.push(movedItem);

            setSections(updated);
            dragItem.current = null;
        }
    };

    // --- SECTION LOGIC ---

    const addSection = (index: number) => {
        const newSection: Section = {
            id: Math.random().toString(36).substr(2, 9),
            title: 'New Section',
            isLocked: false,
            items: []
        };
        const updated = [...sections];
        updated.splice(index, 0, newSection);
        setSections(updated);
    };

    const deleteSection = (e: React.MouseEvent, id: string) => {
        confirmPopup({
            target: e.currentTarget as HTMLElement,
            message: 'Delete this section?',
            icon: 'pi pi-trash',
            accept: () => setSections(sections.filter(s => s.id !== id))
        });
    };

    const deleteItem = (sectionIndex: number, itemId: string) => {
        const updated = [...sections];
        updated[sectionIndex].items = updated[sectionIndex].items.filter(i => i.id !== itemId);
        setSections(updated);
    };

    // --- TITLE EDITING ---
    const startEdit = (section: Section) => {
        if(section.isLocked) return;
        setEditingSectionId(section.id);
        setTempTitle(section.title);
    };

    const saveEdit = () => {
        if (editingSectionId) {
            const updated = sections.map(s => s.id === editingSectionId ? { ...s, title: tempTitle } : s);
            setSections(updated);
            setEditingSectionId(null);
        }
    };

    // --- HELPERS ---
    const getFileIcon = (fileType: string) => {
        switch (fileType) {
            case 'word': return <i className="pi pi-file-word text-blue-500 text-xl"></i>;
            case 'excel': return <i className="pi pi-file-excel text-green-500 text-xl"></i>;
            default: return <i className="pi pi-file text-gray-400 text-xl"></i>;
        }
    };

    return (
        <div className="flex-1 surface-ground flex flex-column h-full">
            <Toast ref={toast} />
            <ConfirmPopup />

            {/* 1. HEADER (Icons Only) */}
            <div className="flex align-items-center justify-content-between p-2 px-3 bg-header border-bottom-1 surface-border" style={{ height: '3rem' }}>
                <span className="font-bold text-sm text-gray-200">Session</span>
                <div className="flex gap-2">
                    <Button icon="pi pi-save" rounded text size="small" severity="secondary" tooltip="Save Session" className="text-gray-400 hover:text-white" />
                    <Button icon="pi pi-folder-open" rounded text size="small" severity="secondary" tooltip="Load Session" className="text-gray-400 hover:text-white" />
                </div>
            </div>

            {/* 2. BODY */}
            <div className="flex-grow-1 overflow-y-auto p-3 custom-scrollbar">

                {sections.map((section, sIndex) => (
                    <React.Fragment key={section.id}>

                        {/* SECTION CARD */}
                        <div
                            className={`session-section mb-1 ${section.isLocked ? 'locked' : ''} ${dragOverSectionIndex === sIndex ? 'drag-over' : ''}`}
                            onDragOver={(e) => handleDragOver(e, sIndex)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => onDrop(e, sIndex)}
                        >
                            {/* Header */}
                            <div className="flex align-items-center justify-content-between mb-2 pb-1 border-bottom-1 border-none">
                                <div className="flex align-items-center gap-2 text-gray-200">
                                    {section.isLocked ? (
                                        <i className="pi pi-lock text-xs text-gray-500"></i>
                                    ) : (
                                        // TODO: Section dragging can be added here
                                        <i className="pi pi-bars text-xs text-gray-600 cursor-move"></i>
                                    )}

                                    {/* Editable Title */}
                                    {editingSectionId === section.id ? (
                                        <InputText
                                            value={tempTitle}
                                            onChange={(e) => setTempTitle(e.target.value)}
                                            onBlur={saveEdit}
                                            onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                                            autoFocus
                                            className="py-0 px-1 h-2rem text-sm"
                                        />
                                    ) : (
                                        <span className="font-bold text-sm cursor-text" onClick={() => startEdit(section)}>
                                            {section.title}
                                        </span>
                                    )}
                                </div>

                                {!section.isLocked && (
                                    <div className="flex gap-1">
                                        <i className="pi pi-pencil text-gray-500 hover:text-white cursor-pointer text-xs" onClick={() => startEdit(section)}></i>
                                        <i className="pi pi-trash text-gray-500 hover:text-red-500 cursor-pointer text-xs ml-2" onClick={(e) => deleteSection(e, section.id)}></i>
                                    </div>
                                )}
                            </div>

                            {/* Files List */}
                            <div className="flex flex-column gap-2">
                                {section.items.length === 0 && !section.isLocked && (
                                    <div className="text-center py-2 text-xs text-gray-600 border-1 border-dashed surface-border border-round">
                                        Drop files here
                                    </div>
                                )}

                                {section.items.map((item, iIndex) => (
                                    <div
                                        key={item.id}
                                        draggable="true"
                                        onDragStart={(e) => handleDragStart(e, 'FILE', sIndex, iIndex)}
                                        className="flex align-items-center p-2 surface-card border-1 surface-border border-round hover:surface-hover transition-colors cursor-move"
                                    >
                                        <div className="flex align-items-center justify-content-center w-2rem mr-2">
                                            {getFileIcon(item.fileType)}
                                        </div>
                                        <div className="flex flex-column flex-grow-1 overflow-hidden">
                                            <span className="text-gray-500 text-xs uppercase font-bold" style={{ fontSize: '0.6rem' }}>File</span>
                                            <span className="font-medium text-sm text-gray-200 white-space-nowrap overflow-hidden text-overflow-ellipsis">{item.name}</span>
                                        </div>
                                        {!section.isLocked && (
                                            <Button
                                                icon="pi pi-times"
                                                rounded text
                                                severity="secondary"
                                                className="h-1rem w-1rem text-gray-600 hover:text-red-400"
                                                onClick={() => deleteItem(sIndex, item.id)}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* SEPARATOR DOT */}
                        {sIndex < sections.length - 1 && (
                            <div className="section-separator">
                                {/* The clickable dot is now a child element */}
                                <div
                                    className="dot"
                                    onClick={() => addSection(sIndex + 1)}
                                    title="Add Section"
                                ></div>
                            </div>
                        )}

                    </React.Fragment>
                ))}
            </div>
        </div>
    );
}