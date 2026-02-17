import { useState, useEffect, useRef } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { Divider } from 'primereact/divider';
import { Toast } from 'primereact/toast';
import type { AppSettings, FolderOption, TransRow } from '../../types/settings';

interface TranslationTabProps {
    settings: AppSettings;
}

export default function TranslationTab({ settings }: TranslationTabProps) {
    const toast = useRef<Toast>(null);

    const [folders, setFolders] = useState<FolderOption[]>([]);
    const [selectedFolder, setSelectedFolder] = useState<FolderOption | null>(null);

    const [fileData, setFileData] = useState<any>({});
    const [currentView, setCurrentView] = useState<string>('Generic');
    const [rows, setRows] = useState<TransRow[]>([]);
    const [loading, setLoading] = useState(false);

    // 1. Load Folders
    useEffect(() => {
        if (settings.library_path) {
            window.electronAPI.getTransFolders(settings.library_path).then((list: FolderOption[]) => {
                setFolders(list);
                if (list.length > 0 && !selectedFolder) setSelectedFolder(list[0]);
            });
        }
    }, [settings.library_path]);

    // 2. Load File Data
    useEffect(() => {
        if (!selectedFolder) return;

        setLoading(true);
        window.electronAPI.loadTrans(selectedFolder.path).then((data: any) => {
            setFileData(data);
            setCurrentView('Generic'); // Reset view on file change
            parseRows(data, 'Generic');
            setLoading(false);
        });
    }, [selectedFolder]);

    // 3. Parse Rows based on View (Generic vs Industry)
    const parseRows = (data: any, view: string) => {
        const newRows: TransRow[] = [];

        Object.entries(data).forEach(([key, content]: [string, any], index) => {
            const row: TransRow = { id: `row-${index}-${Date.now()}`, key: key };

            if (view === 'Generic') {
                const defaults = content.default || {};
                settings.languages.forEach(lang => {
                    row[lang.code] = defaults[lang.code] || '';
                });
            } else {
                const industries = content.industries || {};
                const indData = industries[view] || {};
                settings.languages.forEach(lang => {
                    row[lang.code] = indData[lang.code] || '';
                });
            }
            newRows.push(row);
        });
        setRows(newRows);
    };

    // Re-parse if View or Settings change
    useEffect(() => {
        if (fileData) parseRows(fileData, currentView);
    }, [currentView, settings.languages]);

    const saveFile = async () => {
        if (!selectedFolder) return;

        const updatedData = JSON.parse(JSON.stringify(fileData)); // Deep copy

        rows.forEach(row => {
            if (!row.key.trim()) return;
            if (!updatedData[row.key]) updatedData[row.key] = {};

            if (currentView === 'Generic') {
                if (!updatedData[row.key].default) updatedData[row.key].default = {};
                settings.languages.forEach(lang => {
                    updatedData[row.key].default[lang.code] = row[lang.code];
                });
            } else {
                if (!updatedData[row.key].industries) updatedData[row.key].industries = {};
                if (!updatedData[row.key].industries[currentView]) updatedData[row.key].industries[currentView] = {};
                settings.languages.forEach(lang => {
                    updatedData[row.key].industries[currentView][lang.code] = row[lang.code];
                });
            }
        });

        try {
            await window.electronAPI.saveTrans(selectedFolder.path, updatedData);
            setFileData(updatedData);
            toast.current?.show({ severity: 'success', summary: 'Saved', detail: `Updated ${selectedFolder.name}` });

            // Refresh folder list to update "Override/Master" tags
            window.electronAPI.getTransFolders(settings.library_path).then(setFolders);
        } catch (e) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to save file' });
        }
    };

    const viewOptions = settings.industries.map(ind => ({
        label: ind.code === 'gen' ? 'Generic (Default)' : ind.label,
        value: ind.code === 'gen' ? 'Generic' : ind.code
    }));

    // --- FIX: Add Null Check ---
    const folderTemplate = (option: FolderOption) => {
        if (!option) return <span>Select a folder...</span>;

        return (
            <div className="flex align-items-center justify-content-between w-full">
                <span>{option.name}</span>
                {option.hasFile && (
                    <Tag
                        value={option.isRoot ? "Master" : "Override"}
                        severity={option.isRoot ? "success" : "info"}
                        className="ml-2 text-xs"
                    />
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-column h-full">
            <Toast ref={toast} />

            {/* Controls */}
            <div className="flex gap-3 mb-3 p-3 surface-ground border-round">
                <div className="flex-1 flex flex-column gap-2">
                    <label className="text-xs font-bold text-gray-400">FILE SCOPE</label>
                    <Dropdown
                        value={selectedFolder}
                        options={folders}
                        onChange={(e) => setSelectedFolder(e.value)}
                        optionLabel="name"
                        itemTemplate={folderTemplate}
                        valueTemplate={folderTemplate}
                        className="w-full p-inputtext-sm"
                        placeholder="Select Scope"
                        disabled={!settings.library_path}
                    />
                </div>
                <Divider layout="vertical" />
                <div className="flex-1 flex flex-column gap-2">
                    <label className="text-xs font-bold text-gray-400">INDUSTRY VIEW</label>
                    <Dropdown
                        value={currentView}
                        options={viewOptions}
                        onChange={(e) => setCurrentView(e.value)}
                        className="w-full p-inputtext-sm"
                        placeholder="Select View"
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-content-between align-items-center mb-2">
                <span className="text-gray-400 text-sm">
                    Editing <strong>{viewOptions.find(v => v.value === currentView)?.label}</strong> keys in <strong>{selectedFolder?.name || '...'}</strong>
                </span>
                <div className="flex gap-2">
                    <Button
                        label="Add Key" icon="pi pi-plus" size="small" outlined severity="secondary"
                        disabled={!selectedFolder}
                        onClick={() => {
                            const newRow: TransRow = { id: `new-${Date.now()}`, key: '' };
                            settings.languages.forEach(l => newRow[l.code] = '');
                            setRows([newRow, ...rows]);
                        }}
                    />
                    <Button
                        label="Save Changes" icon="pi pi-save" size="small"
                        disabled={!selectedFolder}
                        onClick={saveFile}
                    />
                </div>
            </div>

            {/* Data Table */}
            <div className="flex-grow-1 overflow-auto border-1 surface-border border-round relative bg-white">
                {loading && (
                    <div className="absolute top-0 left-0 w-full h-full bg-black-alpha-10 flex align-items-center justify-content-center z-5">
                        <i className="pi pi-spin pi-spinner text-4xl text-primary"></i>
                    </div>
                )}

                <DataTable value={rows} size="small" scrollable scrollHeight="flex" className="p-datatable-sm" emptyMessage="No keys found.">
                    <Column
                        field="key" header="Placeholder Key" style={{ width: '25%' }} frozen
                        body={(row) => (
                            <InputText
                                value={row.key}
                                onChange={(e) => setRows(rows.map(r => r.id === row.id ? { ...r, key: e.target.value } : r))}
                                className="w-full p-inputtext-sm font-bold border-none bg-transparent text-primary"
                                placeholder="KEY_NAME"
                            />
                        )}
                    />
                    {settings.languages.map(lang => (
                        <Column
                            key={lang.code}
                            header={lang.code}
                            style={{ minWidth: '200px' }}
                            body={(row) => (
                                <InputText
                                    value={row[lang.code] || ''}
                                    onChange={(e) => setRows(rows.map(r => r.id === row.id ? { ...r, [lang.code]: e.target.value } : r))}
                                    className="w-full p-inputtext-sm border-none bg-transparent"
                                    placeholder="..."
                                />
                            )}
                        />
                    ))}
                    <Column body={(row) => (
                        <Button
                            icon="pi pi-trash" text severity="danger" size="small"
                            onClick={() => setRows(rows.filter(r => r.id !== row.id))}
                        />
                    )} style={{ width: '50px' }} alignHeader={'center'} />
                </DataTable>
            </div>
        </div>
    );
}