import { useRef, type MouseEvent, type DragEvent } from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Button } from 'primereact/button';
import { confirmPopup, ConfirmPopup } from 'primereact/confirmpopup';
import { Toast } from 'primereact/toast';
import { usePlaylistDnD } from '../../hooks/usePlaylistDnD';
import { SortableSection } from './SortableSection';
import type { Section, FileItem } from '../../types/session';

interface PlaylistPanelProps {
    sections: Section[];
    setSections: (val: Section[]) => void;
}

export default function PlaylistPanel({ sections, setSections }: PlaylistPanelProps) {
    const toast = useRef<Toast>(null);

    // Initialize DnD Logic from Custom Hook
    const {
        sensors,
        activeId,
        activeItem,
        dropAnimationConfig,
        closestCenter,
        onDragStart,
        onDragOver,
        onDragEnd
    } = usePlaylistDnD(sections, setSections);

    // --- CRUD ACTIONS (State Management) ---

    const handleAddSection = (index: number) => {
        const newSec: Section = {
            id: Math.random().toString(36).substring(2, 9),
            title: 'New Section',
            isLocked: false,
            items: []
        };
        const updated = [...sections];
        updated.splice(index, 0, newSec);
        setSections(updated);
    };

    const handleRemoveSection = (e: MouseEvent, id: string) => {
        confirmPopup({
            target: e.currentTarget as HTMLElement,
            message: 'Delete section?',
            icon: 'pi pi-trash',
            accept: () => setSections(sections.filter(s => s.id !== id))
        });
    };

    const handleRemoveItem = (secId: string, itemId: string) => {
        const updated = sections.map(sec => {
            if (sec.id === secId) {
                return { ...sec, items: sec.items.filter(i => i.id !== itemId) };
            }
            return sec;
        });
        setSections(updated);
    };

    const handleEditTitle = (id: string, newTitle: string) => {
        setSections(sections.map(s => s.id === id ? { ...s, title: newTitle } : s));
    };

    // --- SMART DROP (Library -> Playlist) ---
    const onNativeDrop = async (e: DragEvent) => {
        e.preventDefault(); // Important to allow drop
        const json = e.dataTransfer.getData('application/json');
        if (!json) return;

        // Logic: Add to the first unlocked section (defaulting to Market Overview usually)
        const targetSection = sections.find(s => !s.isLocked && s.id !== 'intro') || sections.find(s => !s.isLocked);

        if(!targetSection) {
            toast.current?.show({ severity: 'warn', summary: 'Locked', detail: 'No unlocked sections available to drop into.' });
            return;
        }

        try {
            const node = JSON.parse(json);
            const droppedPath = node.data; // Path from Library

            // 1. CALL BACKEND RESOLVER
            // TODO: In the future, pass the actual session language here
            const resolvedFiles = await window.electronAPI.resolveDrop(droppedPath, "EN");

            if (!resolvedFiles || resolvedFiles.length === 0) {
                toast.current?.show({ severity: 'info', summary: 'No files', detail: 'No relevant files found in this selection.' });
                return;
            }

            // 2. TRANSFORM & ADD FILES
            const newItems: FileItem[] = resolvedFiles.map((file: any) => ({
                id: Math.random().toString(36).substring(2, 9),
                name: file.name,
                path: file.path,      // Store real path
                type: 'file',
                fileType: file.type   // 'pptx', 'docx', 'xlsx'
            }));

            const updated = sections.map(s => {
                if (s.id === targetSection.id) {
                    return { ...s, items: [...s.items, ...newItems] };
                }
                return s;
            });

            setSections(updated);
            toast.current?.show({
                severity: 'success',
                summary: 'Added',
                detail: `${newItems.length} file(s) added to ${targetSection.title}`
            });

        } catch(err) {
            console.error("Failed to parse drop data", err);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to process dropped item.' });
        }
    };

    // --- RENDER ---
    return (
        <div className="flex-1 surface-ground flex flex-column h-full"
             onDrop={onNativeDrop}
             onDragOver={(e) => e.preventDefault()} // Necessary to allow dropping
        >
            <Toast ref={toast} />
            <ConfirmPopup />

            {/* HEADER */}
            <div className="flex align-items-center justify-content-between p-2 px-3 bg-header" style={{ height: '3rem' }}>
                <span className="font-bold text-sm text-gray-200">Session</span>
                <div className="flex gap-2">
                    <Button icon="pi pi-save" rounded text size="small" severity="secondary" className="text-gray-400 hover:text-white" tooltip="Save Session" tooltipOptions={{ position: "bottom"}} />
                    <Button icon="pi pi-folder-open" rounded text size="small" severity="secondary" className="text-gray-400 hover:text-white" tooltip="Load Session" tooltipOptions={{ position: "bottom"}} />
                </div>
            </div>

            {/* MAIN LIST AREA */}
            <div className="flex-grow-1 overflow-y-auto p-3 custom-scrollbar">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={onDragStart}
                    onDragOver={onDragOver}
                    onDragEnd={onDragEnd}
                >
                    <SortableContext
                        items={sections.map(s => s.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {sections.map((section, index) => (
                            <SortableSection
                                key={section.id}
                                section={section}
                                sectionIndex={index}
                                sectionsCount={sections.length}
                                onRemoveSection={handleRemoveSection}
                                onRemoveItem={handleRemoveItem}
                                onEditTitle={handleEditTitle}
                                onAddSection={handleAddSection}
                            />
                        ))}
                    </SortableContext>

                    {/* DRAG PREVIEW OVERLAY */}
                    <DragOverlay dropAnimation={dropAnimationConfig}>
                        {activeId && activeItem ? (
                            <div className="p-2 surface-card border-1 surface-border border-round shadow-2" style={{ width: '300px' }}>
                                <span className="font-bold text-sm text-gray-200">
                                    {'title' in activeItem ? activeItem.title : activeItem.name}
                                </span>
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>
        </div>
    );
}