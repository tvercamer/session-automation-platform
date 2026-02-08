import React, { useState, useRef } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
    type DragStartEvent,
    type DragOverEvent,
    type DragEndEvent,
    type DropAnimation,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { confirmPopup, ConfirmPopup } from 'primereact/confirmpopup';
import { Toast } from 'primereact/toast';

// --- TYPES ---
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

// --- SORTABLE ITEM COMPONENT (The File Card) ---
function SortableFileItem({ item, onDelete, isLocked }: { item: FileItem, onDelete: () => void, isLocked: boolean }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: item.id, data: { type: 'FILE', item } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const getFileIcon = (fileType: string) => {
        switch (fileType) {
            case 'word': return <i className="pi pi-file-word text-blue-500 text-xl"></i>;
            case 'excel': return <i className="pi pi-file-excel text-green-500 text-xl"></i>;
            default: return <i className="pi pi-file text-gray-400 text-xl"></i>;
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="flex align-items-center p-2 surface-card border-1 surface-border border-round hover:surface-hover transition-colors cursor-move mb-2"
        >
            <div className="flex align-items-center justify-content-center w-2rem mr-2">
                {getFileIcon(item.fileType)}
            </div>
            <div className="flex flex-column flex-grow-1 overflow-hidden">
                <span className="text-gray-500 text-xs uppercase font-bold" style={{ fontSize: '0.6rem' }}>File</span>
                <span className="font-medium text-sm text-gray-200 white-space-nowrap overflow-hidden text-overflow-ellipsis">{item.name}</span>
            </div>
            {!isLocked && (
                <Button
                    icon="pi pi-times"
                    rounded text
                    severity="secondary"
                    className="h-1rem w-1rem text-gray-600 hover:text-red-400"
                    onPointerDown={(e) => e.stopPropagation()} // Prevent drag start
                    onClick={onDelete}
                />
            )}
        </div>
    );
}

// --- SORTABLE SECTION COMPONENT ---
function SortableSection({ section, sectionIndex, sectionsCount, onRemoveSection, onRemoveItem, onEditTitle, onAddSection }: any) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: section.id,
        data: { type: 'SECTION', section },
        disabled: section.isLocked // Locked sections cannot be dragged
    });

    // We apply the transform to the wrapper, but NOT the styling
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        marginBottom: '0.25rem' // Small spacing
    };

    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(section.title);

    const saveTitle = () => {
        setIsEditing(false);
        onEditTitle(section.id, title);
    };

    return (
        // WRAPPER: Holds the Ref (Draggable), but has no border/background itself
        <div ref={setNodeRef} style={style}>

            {/* THE VISIBLE CARD: Has the border and background */}
            <div className={`session-section ${section.isLocked ? 'locked' : ''}`}>

                {/* Section Header */}
                <div className="flex align-items-center justify-content-between mb-2 pb-1 border-none" {...attributes} {...listeners}>
                    <div className="flex align-items-center gap-2 text-gray-200">
                        {section.isLocked ? (
                            <i className="pi pi-lock text-xs text-gray-500"></i>
                        ) : (
                            <i className="pi pi-bars text-xs text-gray-600 cursor-move"></i>
                        )}

                        {isEditing ? (
                            <InputText
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onBlur={saveTitle}
                                onKeyDown={(e) => e.key === 'Enter' && saveTitle()}
                                autoFocus
                                className="py-0 px-1 h-2rem text-sm"
                                onPointerDown={(e) => e.stopPropagation()} // Allow typing
                            />
                        ) : (
                            <span
                                className="font-bold text-sm cursor-text"
                                onPointerDown={(e) => { e.stopPropagation(); setIsEditing(true); }} // Click to edit
                            >
                                {section.title}
                            </span>
                        )}
                    </div>

                    {!section.isLocked && (
                        <div className="flex gap-1">
                            {/* EDIT ICON */}
                            <i className="pi pi-pencil text-gray-500 hover:text-white cursor-pointer text-xs"
                               onPointerDown={(e) => e.stopPropagation()}
                               onClick={() => setIsEditing(true)}
                            ></i>

                            {/* DELETE ICON */}
                            <i className="pi pi-trash text-gray-500 hover:text-red-500 cursor-pointer text-xs ml-2"
                               onPointerDown={(e) => e.stopPropagation()}
                               onClick={(e) => onRemoveSection(e, section.id)}
                            ></i>
                        </div>
                    )}
                </div>

                {/* Items Context */}
                <SortableContext items={section.items.map((i: any) => i.id)} strategy={verticalListSortingStrategy}>
                    <div className="flex flex-column min-h-2rem">
                        {section.items.length === 0 && !section.isLocked && (
                            <div className="text-center py-2 text-xs text-gray-600 border-1 border-dashed surface-border border-round mb-2">
                                Drop files here
                            </div>
                        )}
                        {section.items.map((item: any) => (
                            <SortableFileItem
                                key={item.id}
                                item={item}
                                isLocked={section.isLocked}
                                onDelete={() => onRemoveItem(section.id, item.id)}
                            />
                        ))}
                    </div>
                </SortableContext>
            </div>

            {/* DOT SEPARATOR: OUTSIDE the Card, but INSIDE the Wrapper */}
            {sectionIndex < sectionsCount - 1 && (
                <div className="section-separator">
                    <div className="dot" onClick={() => onAddSection(sectionIndex + 1)} title="Add Section"></div>
                </div>
            )}
        </div>
    );
}

// --- MAIN COMPONENT ---
export default function PlaylistPanel({ sections, setSections }: PlaylistPanelProps) {
    const toast = useRef<Toast>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeItem, setActiveItem] = useState<any>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // --- CONFIG ---
    const dropAnimationConfig: DropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({
            styles: {
                active: {
                    opacity: '0.5',
                },
            },
        }),
    };

    // --- ACTIONS ---
    const handleAddSection = (index: number) => {
        const newSec: Section = { id: Math.random().toString(36).substr(2, 9), title: 'New Section', isLocked: false, items: [] };
        const updated = [...sections];
        updated.splice(index, 0, newSec);
        setSections(updated);
    };

    const handleRemoveSection = (e: any, id: string) => {
        confirmPopup({
            target: e.currentTarget,
            message: 'Delete section?',
            icon: 'pi pi-trash',
            accept: () => setSections(sections.filter(s => s.id !== id))
        });
    };

    const handleRemoveItem = (secId: string, itemId: string) => {
        const updated = sections.map(sec => {
            if (sec.id === secId) return { ...sec, items: sec.items.filter(i => i.id !== itemId) };
            return sec;
        });
        setSections(updated);
    };

    const handleEditTitle = (id: string, newTitle: string) => {
        setSections(sections.map(s => s.id === id ? { ...s, title: newTitle } : s));
    };

    // --- DND LOGIC ---
    const findSectionContainer = (id: string) => {
        if (sections.find(s => s.id === id)) return id;
        return sections.find(s => s.items.find(i => i.id === id))?.id;
    };

    const onDragStart = (event: DragStartEvent) => {
        const { active } = event;
        setActiveId(active.id as string);

        const currentData = active.data.current;
        if (currentData) {
            if (currentData.type === 'SECTION') {
                setActiveItem(currentData.section);
            } else {
                setActiveItem(currentData.item);
            }
        }
    };

    const onDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeType = active.data.current?.type;
        const overType = over.data.current?.type;

        if (activeType === 'SECTION') return;

        const activeContainer = findSectionContainer(active.id as string);
        const overContainer = findSectionContainer(over.id as string);

        if (!activeContainer || !overContainer || activeContainer === overContainer) return;

        const activeSection = sections.find(s => s.id === activeContainer);
        const overSection = sections.find(s => s.id === overContainer);

        if (!activeSection || !overSection) return;

        const activeItems = activeSection.items;
        const overItems = overSection.items;

        const activeIndex = activeItems.findIndex(i => i.id === active.id);
        const overIndex = overItems.findIndex(i => i.id === over.id);

        let newIndex;
        if (overType === 'SECTION') {
            newIndex = overItems.length + 1;
        } else {
            const isBelowOverItem = over && active.rect.current.translated && active.rect.current.translated.top > over.rect.top + over.rect.height;
            const modifier = isBelowOverItem ? 1 : 0;
            newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
        }

        const newSections = sections.map(sec => {
            if (sec.id === activeContainer) {
                return { ...sec, items: activeItems.filter(i => i.id !== active.id) };
            }
            if (sec.id === overContainer) {
                const newItems = [...sec.items];
                const itemToMove = activeItems[activeIndex];
                newItems.splice(newIndex, 0, itemToMove);
                return { ...sec, items: newItems };
            }
            return sec;
        });

        setSections(newSections);
    };

    const onDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        const activeType = active.data.current?.type;

        if (activeType === 'SECTION' && over) {
            const oldIndex = sections.findIndex(s => s.id === active.id);
            const newIndex = sections.findIndex(s => s.id === over.id);

            if (sections[oldIndex].isLocked || sections[newIndex].isLocked) {
                setActiveId(null);
                setActiveItem(null);
                return;
            }

            if (oldIndex !== newIndex) {
                setSections(arrayMove(sections, oldIndex, newIndex));
            }
        } else if (activeType === 'FILE' && over) {
            const activeContainer = findSectionContainer(active.id as string);
            const overContainer = findSectionContainer(over.id as string);

            if (activeContainer && overContainer && activeContainer === overContainer) {
                const sectionIndex = sections.findIndex(s => s.id === activeContainer);
                const items = sections[sectionIndex].items;
                const oldIndex = items.findIndex(i => i.id === active.id);
                const newIndex = items.findIndex(i => i.id === over.id);

                if (oldIndex !== newIndex) {
                    const newItems = arrayMove(items, oldIndex, newIndex);
                    const newSections = [...sections];
                    newSections[sectionIndex] = { ...newSections[sectionIndex], items: newItems };
                    setSections(newSections);
                }
            }
        }
        setActiveId(null);
        setActiveItem(null);
    };

    // --- LIBRARY DROP HANDLER (NATIVE) ---
    const onNativeDrop = (e: React.DragEvent) => {
        const json = e.dataTransfer.getData('application/json');
        if (!json) return; // Not a library item

        const targetSection = sections.find(s => !s.isLocked) || sections[1];
        if(!targetSection) return;

        try {
            const node = JSON.parse(json);
            const newItem: FileItem = {
                id: Math.random().toString(36).substr(2, 9),
                name: node.label,
                type: 'file',
                fileType: 'word'
            };
            const updated = sections.map(s => s.id === targetSection.id ? { ...s, items: [...s.items, newItem] } : s);
            setSections(updated);
            toast.current?.show({ severity: 'success', summary: 'Added', detail: `${node.label} added to ${targetSection.title}` });
        } catch(e) {}
    };

    return (
        <div className="flex-1 surface-ground flex flex-column h-full"
             onDrop={onNativeDrop}
             onDragOver={(e) => e.preventDefault()}
        >
            <Toast ref={toast} />
            <ConfirmPopup />

            {/* HEADER */}
            <div className="flex align-items-center justify-content-between p-2 px-3 bg-header" style={{ height: '3rem' }}>
                <span className="font-bold text-sm text-gray-200">Session</span>
                <div className="flex gap-2">
                    <Button icon="pi pi-save" rounded text size="small" severity="secondary" className="text-gray-400 hover:text-white" />
                    <Button icon="pi pi-folder-open" rounded text size="small" severity="secondary" className="text-gray-400 hover:text-white" />
                </div>
            </div>

            {/* DND AREA */}
            <div className="flex-grow-1 overflow-y-auto p-3 custom-scrollbar">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={onDragStart}
                    onDragOver={onDragOver}
                    onDragEnd={onDragEnd}
                >
                    <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
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

                    <DragOverlay dropAnimation={dropAnimationConfig}>
                        {activeId && activeItem ? (
                            <div className="p-2 surface-card border-1 surface-border border-round shadow-2" style={{ width: '300px' }}>
                                <span className="font-bold text-sm text-gray-200">
                                    {activeItem.title || activeItem.name}
                                </span>
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>
        </div>
    );
}