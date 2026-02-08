import { useState } from 'react';
import { useSensor, useSensors, PointerSensor, KeyboardSensor, closestCenter, defaultDropAnimationSideEffects } from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { DragStartEvent, DragOverEvent, DragEndEvent, DropAnimation } from '@dnd-kit/core';
import type { Section, FileItem } from '../types/session.ts';

export const usePlaylistDnD = (
    sections: Section[],
    setSections: (sections: Section[]) => void
) => {
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeItem, setActiveItem] = useState<Section | FileItem | null>(null);

    // --- SENSORS ---
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // 5px movement required before drag starts
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
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

    // --- HELPER: Find which section an item belongs to ---
    const findSectionContainer = (id: string) => {
        if (sections.find((s) => s.id === id)) return id;
        return sections.find((s) => s.items.find((i) => i.id === id))?.id;
    };

    // --- HANDLER: Drag Start ---
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

    // --- HANDLER: Drag Over (Moving items between containers) ---
    const onDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeType = active.data.current?.type;
        const overType = over.data.current?.type;

        // TODO: This code only handles cross-container movement for FILES
        if (activeType === 'SECTION') return;

        const activeContainer = findSectionContainer(active.id as string);
        const overContainer = findSectionContainer(over.id as string);

        if (
            !activeContainer ||
            !overContainer ||
            activeContainer === overContainer
        ) {
            return;
        }

        // Logic to move item visually to the new section while dragging
        const activeSection = sections.find((s) => s.id === activeContainer);
        const overSection = sections.find((s) => s.id === overContainer);

        if (!activeSection || !overSection) return;

        const activeItems = activeSection.items;
        const overItems = overSection.items;

        const activeIndex = activeItems.findIndex((i) => i.id === active.id);
        const overIndex = overItems.findIndex((i) => i.id === over.id);

        let newIndex;
        if (overType === 'SECTION') {
            // Dropped onto a section header -> add to end of that section
            newIndex = overItems.length + 1;
        } else {
            // Calculate if we are dropping above or below the target
            const isBelowOverItem =
                over &&
                active.rect.current.translated &&
                active.rect.current.translated.top >
                over.rect.top + over.rect.height;

            const modifier = isBelowOverItem ? 1 : 0;
            newIndex =
                overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
        }

        // Update State
        const newSections = sections.map((sec) => {
            if (sec.id === activeContainer) {
                return {
                    ...sec,
                    items: activeItems.filter((i) => i.id !== active.id),
                };
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

    // --- HANDLER: Drag End (Final Reordering) ---
    const onDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        const activeType = active.data.current?.type;

        // Reordering SECTIONS
        if (activeType === 'SECTION' && over) {
            const oldIndex = sections.findIndex((s) => s.id === active.id);
            const newIndex = sections.findIndex((s) => s.id === over.id);

            // Guard: Prevent moving locked sections (Index 0 or Last Index usually)
            if (sections[oldIndex].isLocked || sections[newIndex].isLocked) {
                setActiveId(null);
                setActiveItem(null);
                return;
            }

            if (oldIndex !== newIndex) {
                setSections(arrayMove(sections, oldIndex, newIndex));
            }
        }
        // Reordering FILES (within same container/section)
        else if (activeType === 'FILE' && over) {
            const activeContainer = findSectionContainer(active.id as string);
            const overContainer = findSectionContainer(over.id as string);

            if (
                activeContainer &&
                overContainer &&
                activeContainer === overContainer
            ) {
                const sectionIndex = sections.findIndex(
                    (s) => s.id === activeContainer
                );
                const items = sections[sectionIndex].items;
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);

                if (oldIndex !== newIndex) {
                    const newItems = arrayMove(items, oldIndex, newIndex);
                    const newSections = [...sections];
                    newSections[sectionIndex] = {
                        ...newSections[sectionIndex],
                        items: newItems,
                    };
                    setSections(newSections);
                }
            }
        }

        setActiveId(null);
        setActiveItem(null);
    };

    return {
        sensors,
        activeId,
        activeItem,
        dropAnimationConfig,
        closestCenter,
        onDragStart,
        onDragOver,
        onDragEnd
    };
};