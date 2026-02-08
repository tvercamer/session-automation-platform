import React, { useState } from 'react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { InputText } from 'primereact/inputtext';
import type { Section } from '../../types/session';
import { SortableFileItem } from './SortableFileItem';

interface SortableSectionProps {
    section: Section;
    sectionIndex: number;
    sectionsCount: number;
    onRemoveSection: (e: React.MouseEvent, id: string) => void;
    onRemoveItem: (sectionId: string, itemId: string) => void;
    onEditTitle: (id: string, newTitle: string) => void;
    onAddSection: (index: number) => void;
}

export function SortableSection({
                                    section,
                                    sectionIndex,
                                    sectionsCount,
                                    onRemoveSection,
                                    onRemoveItem,
                                    onEditTitle,
                                    onAddSection
                                }: SortableSectionProps) {

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

    // Style for the wrapper (handles movement)
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        marginBottom: '0.25rem'
    };

    // --- LOCAL STATE (Title Editing) ---
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(section.title);

    const saveTitle = () => {
        setIsEditing(false);
        if (title.trim() !== "") {
            onEditTitle(section.id, title);
        } else {
            setTitle(section.title); // Revert if empty
        }
    };

    return (
        // WRAPPER: Holds the Ref (Draggable)
        <div ref={setNodeRef} style={style}>

            {/* THE VISIBLE CARD */}
            <div className={`session-section ${section.isLocked ? 'locked' : ''}`}>

                {/* HEADER: Drag Handle + Title + Actions */}
                <div
                    className="flex align-items-center justify-content-between mb-2 pb-1 border-none"
                    {...attributes}
                    {...listeners}
                >
                    <div className="flex align-items-center gap-2 text-gray-200">
                        {/* Drag Handle / Lock Icon */}
                        {section.isLocked ? (
                            <i className="pi pi-lock text-xs text-gray-500"></i>
                        ) : (
                            <i className="pi pi-bars text-xs text-gray-600 cursor-move"></i>
                        )}

                        {/* Editable Title */}
                        {isEditing ? (
                            <InputText
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onBlur={saveTitle}
                                onKeyDown={(e) => e.key === 'Enter' && saveTitle()}
                                autoFocus
                                className="py-0 px-1 h-2rem text-sm"
                                onPointerDown={(e) => e.stopPropagation()} // Allow interaction
                            />
                        ) : (
                            <span
                                className="font-bold text-sm cursor-text"
                                onPointerDown={(e) => { e.stopPropagation(); setIsEditing(true); }} // Stop drag to edit
                            >
                                {section.title}
                            </span>
                        )}
                    </div>

                    {/* Section Actions */}
                    {!section.isLocked && (
                        <div className="flex gap-1">
                            {/* Edit Icon */}
                            <i className="pi pi-pencil text-gray-500 hover:text-white cursor-pointer text-xs"
                               onPointerDown={(e) => e.stopPropagation()}
                               onClick={() => setIsEditing(true)}
                            ></i>

                            {/* Delete Icon */}
                            <i className="pi pi-trash text-gray-500 hover:text-red-500 cursor-pointer text-xs ml-2"
                               onPointerDown={(e) => e.stopPropagation()}
                               onClick={(e) => onRemoveSection(e, section.id)}
                            ></i>
                        </div>
                    )}
                </div>

                {/* ITEMS LIST (Wrapped in SortableContext for inner drag) */}
                <SortableContext
                    items={section.items.map((i) => i.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="flex flex-column min-h-2rem">
                        {/* Empty State Placeholder */}
                        {section.items.length === 0 && !section.isLocked && (
                            <div className="text-center py-2 text-xs text-gray-600 border-1 border-dashed surface-border border-round mb-2">
                                Drop files here
                            </div>
                        )}

                        {/* Render Files */}
                        {section.items.map((item) => (
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

            {/* DOT SEPARATOR (Sibling to Card, inside Wrapper) */}
            {sectionIndex < sectionsCount - 1 && (
                <div className="section-separator">
                    <div
                        className="dot"
                        onClick={() => onAddSection(sectionIndex + 1)}
                        title="Add Section"
                    ></div>
                </div>
            )}
        </div>
    );
}