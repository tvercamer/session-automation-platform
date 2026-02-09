import React, { useState, useEffect, useRef } from 'react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
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
    isEditing: boolean;
    onStartEditing: () => void;
}

export function SortableSection({
                                    section,
                                    sectionIndex,
                                    // sectionsCount,
                                    onRemoveSection,
                                    onRemoveItem,
                                    onEditTitle,
                                    onAddSection,
                                    isEditing,
                                    onStartEditing
                                }: SortableSectionProps) {

    const [titleValue, setTitleValue] = useState(section.title);
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync if prop changes
    useEffect(() => {
        setTitleValue(section.title);
    }, [section.title]);

    // Auto-select text on edit
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

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
        disabled: section.isLocked
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        marginBottom: '0.25rem'
    };

    const handleBlur = () => {
        if (titleValue.trim()) {
            onEditTitle(section.id, titleValue);
        } else {
            setTitleValue(section.title);
            onEditTitle(section.id, section.title);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        e.stopPropagation(); // Allow spaces
        if (e.key === 'Enter') {
            handleBlur();
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            data-section-id={section.id}
        >
            <div className={`session-section ${section.isLocked ? 'locked' : ''}`}>

                {/* HEADER */}
                <div className="flex align-items-center justify-content-between mb-2 pb-1 border-none">

                     {/* LEFT: Drag Handle & Title */}
                         <div className="flex align-items-center gap-2 text-gray-200 flex-grow-1">

                             {/* DRAG HANDLE: Listeners are ONLY here now */}
                             {section.isLocked ? (
                                 <i className="pi pi-lock text-xs text-gray-500"></i>
                             ) : (
                                 <i
                                     className="pi pi-bars text-xs text-gray-600 cursor-move p-2"
                                     {...attributes}
                                     {...listeners}
                                 ></i>
                             )}

                             {isEditing ? (
                                 <InputText
                                     ref={inputRef}
                                     value={titleValue}
                                     onChange={(e) => setTitleValue(e.target.value)}
                                     onBlur={handleBlur}
                                     onKeyDown={handleKeyDown}
                                     // Stop propagation so we can click inside without triggering DnD
                                     onPointerDown={(e) => e.stopPropagation()}
                                     className="p-inputtext-sm py-1 h-2rem text-sm flex-grow-1"
                                 />
                             ) : (
                                 <span
                                     className="font-bold text-sm cursor-text hover:text-blue-500 transition-colors flex-grow-1"
                                     onClick={(e) => {
                                         e.stopPropagation();
                                         onStartEditing();
                                     }}
                                 >
                                {section.title}
                            </span>
                             )}
                         </div>

                     {/* RIGHT: Actions */}
                         {!section.isLocked && (
                             <div className="flex gap-1 align-items-center ml-2">
                                 <Button
                                     icon="pi pi-pencil"
                                     rounded text size="small"
                                     severity="secondary"
                                     className="h-2rem w-2rem text-gray-500 hover:text-white"
                                     onClick={(e) => {
                                         e.stopPropagation();
                                         onStartEditing();
                                     }}
                                 />
                                 <Button
                                     icon="pi pi-trash"
                                     rounded text size="small"
                                     severity="danger"
                                     className="h-2rem w-2rem"
                                     onClick={(e) => onRemoveSection(e, section.id)}
                                 />
                             </div>
                         )}
                </div>

                {/* ITEMS */}
                <SortableContext
                    items={section.items.map((i) => i.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="flex flex-column min-h-2rem">
                        {section.items.length === 0 && !section.isLocked && (
                            <div className="text-center py-2 text-xs text-gray-600 border-1 border-dashed surface-border border-round mb-2 pointer-events-none">
                                Drop files here
                            </div>
                        )}
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

            {/* DOT SEPARATOR: Adds to index + 1 */}
            {/* The first dot is handled in PlaylistPanel, this handles subsequent dots */}
            <div className="section-separator" data-insert-index={sectionIndex + 1}>
                <div
                    className="dot"
                    onClick={() => onAddSection(sectionIndex + 1)}
                    title="Add Section Here"
                ></div>
            </div>
        </div>
    );
}