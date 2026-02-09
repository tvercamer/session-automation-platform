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
                                    onRemoveSection,
                                    onRemoveItem,
                                    onEditTitle,
                                    onAddSection,
                                    isEditing,
                                    onStartEditing
                                }: SortableSectionProps) {

    const [titleValue, setTitleValue] = useState(section.title);
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync state with props
    useEffect(() => {
        setTitleValue(section.title);
    }, [section.title]);

    // Auto-focus when editing
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
            onEditTitle(section.id, section.title); // Cancel edit
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        e.stopPropagation(); // Allow spaces in input
        if (e.key === 'Enter') {
            handleBlur();
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            // --- CRITICAL FIX: This allows PlaylistPanel to detect the drop target ---
            data-section-id={section.id}
        >
            <div className={`session-section ${section.isLocked ? 'locked' : ''} surface-card border-1 surface-border border-round mb-2`}>

                {/* HEADER */}
                <div
                    className="flex align-items-center justify-content-between p-2 border-bottom-1 surface-border"
                >
                    {/* LEFT: Drag Handle & Title */}
                    <div className="flex align-items-center gap-2 text-gray-200 flex-grow-1 overflow-hidden">

                        {/* Drag Handle */}
                        {section.isLocked ? (
                            <i className="pi pi-lock text-xs text-gray-500 mr-2"></i>
                        ) : (
                            <i
                                className="pi pi-bars text-gray-500 cursor-move mr-2 hover:text-white"
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
                                onPointerDown={(e) => e.stopPropagation()}
                                className="p-inputtext-sm py-1 w-full"
                            />
                        ) : (
                            <span
                                className="font-bold text-sm white-space-nowrap overflow-hidden text-overflow-ellipsis cursor-pointer hover:text-primary transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onStartEditing();
                                }}
                                title="Click to edit"
                            >
                                {section.title}
                            </span>
                        )}
                    </div>

                    {/* RIGHT: Actions */}
                    {!section.isLocked && (
                        <div className="flex gap-1">
                            <Button
                                icon="pi pi-pencil"
                                rounded text
                                severity="secondary"
                                className="w-2rem h-2rem text-gray-500"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onStartEditing();
                                }}
                            />
                            <Button
                                icon="pi pi-trash"
                                rounded text
                                severity="danger"
                                className="w-2rem h-2rem"
                                onClick={(e) => onRemoveSection(e, section.id)}
                            />
                        </div>
                    )}
                </div>

                {/* ITEMS LIST */}
                <div className="p-2 min-h-3rem">
                    <SortableContext
                        items={section.items.map(i => i.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {section.items.length === 0 && !section.isLocked && (
                            <div className="text-center text-xs text-gray-600 font-italic py-3 select-none pointer-events-none">
                                Drag files here
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
                    </SortableContext>
                </div>
            </div>

            {/* DOT SEPARATOR */}
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