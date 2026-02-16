import { useRef, useState, useEffect, type MouseEvent, type DragEvent } from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Button } from 'primereact/button';
import { confirmPopup, ConfirmPopup } from 'primereact/confirmpopup';
import { Toast } from 'primereact/toast';
import { usePlaylistDnD } from '../../hooks/usePlaylistDnD';
import { SortableSection } from './SortableSection';
import type { Section, FileItem, SessionSettings } from '../../types/session';

interface PlaylistPanelProps {
    sections: Section[];
    setSections: (val: Section[]) => void;
    settings: SessionSettings;
}

export default function PlaylistPanel({ sections, setSections, settings }: PlaylistPanelProps) {
    const toast = useRef<Toast>(null);
    const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
    const [justAddedSectionId, setJustAddedSectionId] = useState<string | null>(null);

    const [generating, setGenerating] = useState(false);

    // NIEUW: Houdt het pad bij van de laatst gegenereerde sessie
    const [lastGeneratedPath, setLastGeneratedPath] = useState<string | null>(null);

    // Filter out Intro/Outro from the draggable list
    const visibleSections = sections.filter(s =>
        s.id !== 'intro' &&
        s.id !== 'outro' &&
        s.title.toLowerCase() !== 'introduction' &&
        s.title.toLowerCase() !== 'outro'
    );

    useEffect(() => {
        if (justAddedSectionId) {
            setEditingSectionId(justAddedSectionId);
            setJustAddedSectionId(null);
        }
    }, [justAddedSectionId]);

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

    // --- ACTIONS ---

    const handleAddSection = (index: number) => {
        const newId = Math.random().toString(36).substring(2, 9);
        const newSec: Section = {
            id: newId,
            title: 'New Section',
            isLocked: false,
            items: []
        };

        const updated = [...sections];
        let realIndex = updated.length - 1;

        if (index === 0) {
            const introIdx = updated.findIndex(s => s.id === 'intro' || s.title === 'Introduction');
            realIndex = introIdx + 1;
        } else if (index < visibleSections.length) {
            const prevVisible = visibleSections[index - 1];
            const prevIdx = updated.findIndex(s => s.id === prevVisible.id);
            realIndex = prevIdx + 1;
        }

        if (realIndex < 0) realIndex = 0;
        if (realIndex > updated.length) realIndex = updated.length;

        updated.splice(realIndex, 0, newSec);
        setSections(updated);
        setJustAddedSectionId(newId);
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
        setEditingSectionId(null);
    };

    // --- GENERATE HANDLER ---
    const handleGenerate = async () => {
        // 1. Validatie
        if (!settings.customer || !settings.language || !settings.industry) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Configuratie',
                detail: 'Selecteer eerst een Klant, Industrie en Taal.'
            });
            return;
        }

        setGenerating(true);
        setLastGeneratedPath(null); // Resetten voor nieuwe run

        // --- SAFE DATA EXTRACTION ---
        const getCustomerName = (c: any) => {
            if (!c) return "Onbekende Klant";
            if (typeof c === 'string') return c;
            return c.name || "Onbekende Klant";
        };

        const getIndustryLabel = (i: any) => {
            if (!i) return "Generic";
            if (typeof i === 'string') return i;
            return i.label || i.name || "Generic";
        };

        const getIndustryCode = (i: any) => {
            if (!i) return "gen";
            if (typeof i === 'string') return i.toLowerCase();
            return i.code || "gen";
        };

        const getLanguageCode = (l: any) => {
            if (!l) return "EN";
            if (typeof l === 'string') return l;
            return l.code || "EN";
        };
        // ---------------------------

        const sectionsPayload = visibleSections.map(sec => ({
            title: sec.title,
            topics: sec.items.map(item => item.name)
        }));

        try {
            const result = await window.electronAPI.generateSession({
                session_name: settings.sessionName || 'Sessie',
                date: settings.date ? settings.date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                customer_name: getCustomerName(settings.customer),
                customer_industry: getIndustryLabel(settings.industry),
                industry_code: getIndustryCode(settings.industry),
                language_code: getLanguageCode(settings.language),
                sections: sectionsPayload
            });

            // --- DE FIX: Zorg dat we het resultaat opslaan ---
            if (result && result.status === 'success') {
                console.log("Generatie succesvol, pad:", result.target_dir);
                setLastGeneratedPath(result.target_dir);
                toast.current?.show({ severity: 'success', summary: 'Klaar!', detail: 'Sessie gegenereerd.' });
            } else {
                toast.current?.show({ severity: 'error', summary: 'Fout', detail: 'Geen pad ontvangen van backend.' });
            }

        } catch (err) {
            console.error("Fout tijdens genereren:", err);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Generatie mislukt. Zie console.' });
        } finally {
            setGenerating(false);
        }
    };

    // --- PREVIEW HANDLER (NIEUW) ---
    const handlePreview = () => {
        if (lastGeneratedPath) {
            window.electronAPI.openPath(lastGeneratedPath);
        }
    };

    // --- SMART DROP HANDLER ---
    const onNativeDrop = async (e: DragEvent) => {
        e.preventDefault();
        const json = e.dataTransfer.getData('application/json');
        if (!json) return;

        try {
            const node = JSON.parse(json);
            const droppedPath = node.data;
            const droppedLabel = node.label;

            const dropTarget = document.elementFromPoint(e.clientX, e.clientY);

            const insertElement = dropTarget?.closest('[data-insert-index]');
            const insertIndexAttr = insertElement?.getAttribute('data-insert-index');
            const sectionElement = dropTarget?.closest('[data-section-id]');
            const targetSectionId = sectionElement?.getAttribute('data-section-id');

            const resolvedFiles = await window.electronAPI.resolveDrop(droppedPath);

            if (!resolvedFiles || resolvedFiles.length === 0) {
                toast.current?.show({ severity: 'warn', summary: 'Ignored', detail: 'No generic base files found.' });
                return;
            }

            const newItems: FileItem[] = resolvedFiles.map((file: any) => ({
                id: Math.random().toString(36).substring(2, 9),
                name: file.name,
                path: file.path,
                type: 'file',
                fileType: file.type
            }));

            let updatedSections = [...sections];

            if (insertIndexAttr !== null && insertIndexAttr !== undefined) {
                // CASE A: Dropped on a Dot
                const visIndex = parseInt(insertIndexAttr, 10);

                let realIndex = updatedSections.length - 1;
                if (visIndex === 0) {
                    const introIdx = updatedSections.findIndex(s => s.id === 'intro' || s.title === 'Introduction');
                    realIndex = introIdx + 1;
                } else {
                    const prevVisible = visibleSections[visIndex - 1];
                    const prevIdx = updatedSections.findIndex(s => s.id === prevVisible.id);
                    realIndex = prevIdx + 1;
                }

                const newId = Math.random().toString(36).substring(2, 9);
                const newSec: Section = {
                    id: newId,
                    title: droppedLabel,
                    isLocked: false,
                    items: newItems
                };
                updatedSections.splice(realIndex, 0, newSec);
                setJustAddedSectionId(newId);
                toast.current?.show({ severity: 'success', summary: 'Created', detail: `Created section` });

            } else if (targetSectionId) {
                // CASE B: Dropped on Section
                const targetSec = updatedSections.find(s => s.id === targetSectionId);
                if (targetSec?.isLocked) {
                    toast.current?.show({ severity: 'error', summary: 'Locked', detail: 'Section is locked.' });
                    return;
                }
                updatedSections = updatedSections.map(s => {
                    if (s.id === targetSectionId) {
                        return { ...s, items: [...s.items, ...newItems] };
                    }
                    return s;
                });
                toast.current?.show({ severity: 'success', summary: 'Added', detail: `Added to ${targetSec?.title}` });

            } else {
                // CASE C: Background Drop
                const newId = Math.random().toString(36).substring(2, 9);
                const newSec: Section = {
                    id: newId,
                    title: droppedLabel,
                    isLocked: false,
                    items: newItems
                };

                const outroIndex = updatedSections.findIndex(s => s.id === 'outro' || s.title === 'Outro');
                const insertPos = outroIndex >= 0 ? outroIndex : updatedSections.length;

                updatedSections.splice(insertPos, 0, newSec);
                setJustAddedSectionId(newId);
                toast.current?.show({ severity: 'success', summary: 'Created', detail: `Created section` });
            }

            setSections(updatedSections);

        } catch(err) {
            console.error("Drop failed", err);
        }
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
                    <Button icon="pi pi-save" rounded text size="small" severity="secondary" className="text-gray-400 hover:text-white" tooltip="Save Session" tooltipOptions={{ position: "bottom"}} />
                    <Button icon="pi pi-folder-open" rounded text size="small" severity="secondary" className="text-gray-400 hover:text-white" tooltip="Load Session" tooltipOptions={{ position: "bottom"}} />
                </div>
            </div>

            {/* LIST AREA */}
            <div className="flex-grow-1 overflow-y-auto p-3 custom-scrollbar">

                {/* FIXED INTRO */}
                <div className="p-3 border-1 border-dashed surface-border border-round opacity-60 flex align-items-center justify-content-center bg-black-alpha-10 mb-3">
                    <i className="pi pi-lock mr-2 text-xs"></i>
                    <span className="font-bold text-sm">Introduction</span>
                </div>

                {/* FIRST DOT */}
                <div
                    className="section-separator mb-3"
                    data-insert-index="0"
                    style={{ height: '10px' }}
                >
                    <div
                        className="dot"
                        onClick={() => handleAddSection(0)}
                        title="Add Section Here"
                    ></div>
                </div>

                {/* DYNAMIC SECTIONS */}
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={onDragStart}
                    onDragOver={onDragOver}
                    onDragEnd={onDragEnd}
                >
                    <SortableContext items={visibleSections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                        {visibleSections.map((section, index) => (
                            <SortableSection
                                key={section.id}
                                section={section}
                                sectionIndex={index}
                                sectionsCount={visibleSections.length}
                                isEditing={editingSectionId === section.id}
                                onStartEditing={() => setEditingSectionId(section.id)}
                                onEditTitle={handleEditTitle}
                                onRemoveSection={handleRemoveSection}
                                onRemoveItem={handleRemoveItem}
                                onAddSection={handleAddSection}
                            />
                        ))}
                    </SortableContext>

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

                {/* FIXED OUTRO */}
                <div className="p-3 border-1 border-dashed surface-border border-round opacity-60 flex align-items-center justify-content-center bg-black-alpha-10 mt-2">
                    <i className="pi pi-lock mr-2 text-xs"></i>
                    <span className="font-bold text-sm">Outro</span>
                </div>
            </div>

            {/* FOOTER: Actions */}
            <div className="p-3 border-top-1 surface-border bg-gray-900 flex gap-2">
                <Button
                    label={generating ? "Generating..." : "Generate Session"}
                    icon={generating ? "pi pi-spin pi-spinner" : "pi pi-cog"}
                    className="flex-1 p-button-primary"
                    onClick={handleGenerate}
                    disabled={generating}
                />

                <Button
                    disabled={!lastGeneratedPath}
                    label="Preview Files"
                    icon="pi pi-folder-open"
                    className="flex-1 p-button-outlined p-button-secondary"
                    onClick={handlePreview}
                />
            </div>
        </div>
    );
}