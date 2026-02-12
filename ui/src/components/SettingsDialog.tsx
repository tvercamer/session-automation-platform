import { useState, useEffect, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { TabView, TabPanel } from 'primereact/tabview';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { Divider } from 'primereact/divider';

interface SettingsDialogProps {
    visible: boolean;
    onHide: () => void;
    onSettingsChanged?: () => void;
}

// --- TYPES ---
interface Language {
    code: string;
    label: string;
}

interface AppSettings {
    library_path: string;
    output_path: string;
    languages: Language[];
}

interface FolderOption {
    name: string;
    path: string;
    hasFile: boolean;
    isRoot: boolean;
}

// Row for the Grid (Flattened view of the JSON)
interface TransRow {
    id: string;
    key: string;
    [langCode: string]: string; // Dynamic language columns
}

export default function SettingsDialog({ visible, onHide, onSettingsChanged }: SettingsDialogProps) {
    const toast = useRef<Toast>(null);

    // --- GLOBAL SETTINGS STATE ---
    const [appSettings, setAppSettings] = useState<AppSettings>({ library_path: '', output_path: '', languages: [] });

    // --- LANGUAGE MANAGER STATE ---
    const [newLangCode, setNewLangCode] = useState('');
    const [newLangLabel, setNewLangLabel] = useState('');

    // --- TRANSLATION EDITOR STATE ---
    const [folders, setFolders] = useState<FolderOption[]>([]);
    const [selectedFolder, setSelectedFolder] = useState<FolderOption | null>(null);

    // The raw JSON loaded from file
    const [fileData, setFileData] = useState<any>({});

    // View State (Industry)
    const [views, setViews] = useState<string[]>(['Generic']);
    const [currentView, setCurrentView] = useState<string>('Generic');
    const [newViewName, setNewViewName] = useState('');
    const [isAddingView, setIsAddingView] = useState(false);

    // Grid State
    const [rows, setRows] = useState<TransRow[]>([]);
    const [loadingTrans, setLoadingTrans] = useState(false);

    // --- LOAD ON OPEN ---
    useEffect(() => {
        if (visible) {
            loadGeneralSettings();
        }
    }, [visible]);

    const loadGeneralSettings = async () => {
        try {
            const settings = await window.electronAPI.getSettings();
            // Ensure languages array exists
            if (!settings.languages) settings.languages = [];
            setAppSettings(settings);

            if (settings.library_path) {
                loadFolderList(settings.library_path);
            }
        } catch (e) { console.error(e); }
    };

    const loadFolderList = async (rootPath: string) => {
        try {
            const list = await window.electronAPI.getTransFolders(rootPath);
            setFolders(list);
            // Select Root if nothing selected
            if (!selectedFolder && list.length > 0) setSelectedFolder(list[0]);
        } catch (e) { console.error(e); }
    };

    // --- TRANSLATION LOGIC ---

    // 1. Load File when Folder Changes
    useEffect(() => {
        if (selectedFolder && visible) {
            loadFile(selectedFolder.path);
        }
    }, [selectedFolder, visible]);

    const loadFile = async (targetPath: string) => {
        setLoadingTrans(true);
        try {
            const data = await window.electronAPI.loadTrans(targetPath);
            setFileData(data); // Store raw JSON

            // Extract available Views (Industries)
            const availableViews = ['Generic'];

            // Scan the loaded JSON to find any existing industries
            Object.values(data).forEach((entry: any) => {
                if (entry.industries) {
                    Object.keys(entry.industries).forEach(ind => {
                        if (!availableViews.includes(ind)) availableViews.push(ind);
                    });
                }
            });
            setViews(availableViews);
            setCurrentView('Generic'); // Reset to generic on file load

            // Populate Grid for 'Generic' view
            parseRowsForView(data, 'Generic');

        } catch (e) {
            console.error(e);
            toast.current?.show({severity:'error', summary:'Error', detail:'Failed to load file'});
        } finally {
            setLoadingTrans(false);
        }
    };

    // 2. Parse JSON -> Grid Rows based on View
    const parseRowsForView = (data: any, view: string) => {
        const newRows: TransRow[] = [];

        Object.entries(data).forEach(([key, content]: [string, any], index) => {
            const row: TransRow = {
                id: `row-${index}-${Date.now()}`,
                key: key
            };

            // If View is Generic, read from content.default
            if (view === 'Generic') {
                const defaults = content.default || {};
                appSettings.languages.forEach(lang => {
                    row[lang.code] = defaults[lang.code] || '';
                });
            }
            // If View is Industry, read from content.industries[view]
            else {
                const industries = content.industries || {};
                const indData = industries[view] || {};
                appSettings.languages.forEach(lang => {
                    row[lang.code] = indData[lang.code] || '';
                });
            }
            newRows.push(row);
        });
        setRows(newRows);
    };

    // 3. Switch View
    useEffect(() => {
        if (fileData) {
            parseRowsForView(fileData, currentView);
        }
    }, [currentView]);


    // --- ACTIONS ---

    const saveSettings = async (newSettings: AppSettings) => {
        try {
            await window.electronAPI.saveSettings(newSettings);
            setAppSettings(newSettings);
            toast.current?.show({severity:'success', summary:'Saved', detail:'Settings updated'});
            if (onSettingsChanged) onSettingsChanged();
        } catch (e) {
            toast.current?.show({severity:'error', summary:'Error', detail:'Failed to save settings'});
        }
    };

    const addLanguage = () => {
        if (!newLangCode || !newLangLabel) return;
        const updated = { ...appSettings, languages: [...appSettings.languages, { code: newLangCode.toUpperCase(), label: newLangLabel }] };
        saveSettings(updated);
        setNewLangCode('');
        setNewLangLabel('');
    };

    const removeLanguage = (code: string) => {
        const updated = { ...appSettings, languages: appSettings.languages.filter(l => l.code !== code) };
        saveSettings(updated);
    };

    const saveTranslationFile = async () => {
        if (!selectedFolder) return;

        // 1. Deep copy current fileData
        const updatedData = JSON.parse(JSON.stringify(fileData));

        // 2. Merge Grid Rows into JSON
        rows.forEach(row => {
            if (!row.key.trim()) return;

            // Ensure structure exists
            if (!updatedData[row.key]) updatedData[row.key] = {};

            if (currentView === 'Generic') {
                if (!updatedData[row.key].default) updatedData[row.key].default = {};

                appSettings.languages.forEach(lang => {
                    updatedData[row.key].default[lang.code] = row[lang.code];
                });
            } else {
                if (!updatedData[row.key].industries) updatedData[row.key].industries = {};
                if (!updatedData[row.key].industries[currentView]) updatedData[row.key].industries[currentView] = {};

                appSettings.languages.forEach(lang => {
                    updatedData[row.key].industries[currentView][lang.code] = row[lang.code];
                });
            }
        });

        // 3. Save to disk
        try {
            await window.electronAPI.saveTrans(selectedFolder.path, updatedData);
            setFileData(updatedData); // Update local state
            toast.current?.show({severity:'success', summary:'Saved', detail:`Saved to ${selectedFolder.name}`});
            loadFolderList(appSettings.library_path); // Refresh badges
        } catch (e) {
            toast.current?.show({severity:'error', summary:'Error', detail:'Failed to save file'});
        }
    };

    const addNewView = () => {
        if (!newViewName) return;
        const name = newViewName.toLowerCase(); // Standardize
        if (!views.includes(name)) {
            setViews([...views, name]);
            setCurrentView(name);
        }
        setIsAddingView(false);
        setNewViewName('');
    };

    // --- GRID EDITORS ---
    const updateRowKey = (id: string, val: string) => {
        setRows(rows.map(r => r.id === id ? { ...r, key: val } : r));
    };

    const updateRowVal = (id: string, lang: string, val: string) => {
        setRows(rows.map(r => r.id === id ? { ...r, [lang]: val } : r));
    };

    const addNewRow = () => {
        const newRow: TransRow = { id: `new-${Date.now()}`, key: '' };
        appSettings.languages.forEach(l => newRow[l.code] = '');
        setRows([newRow, ...rows]); // Add to top
    };

    // --- RENDER HELPERS ---
    const folderTemplate = (option: FolderOption) => (
        <div className="flex align-items-center justify-content-between w-full">
            <span>{option.name}</span>
            {option.hasFile && <Tag value={option.isRoot ? "Master" : "Override"} severity={option.isRoot ? "success" : "info"} className="ml-2 text-xs" />}
        </div>
    );

    return (
        <Dialog header="Settings" visible={visible} style={{ width: '70vw', height: '85vh' }} onHide={onHide} contentClassName="flex flex-column">
            <Toast ref={toast} />
            <TabView className="flex-grow-1 flex flex-column">

                {/* TAB 1: GENERAL */}
                <TabPanel header="General" leftIcon="pi pi-cog mr-2">
                    <div className="flex flex-column gap-4 p-2">
                        <div className="flex flex-column gap-2">
                            <label className="font-bold">Library Path</label>
                            <div className="p-inputgroup">
                                <InputText value={appSettings.library_path} onChange={(e) => setAppSettings({ ...appSettings, library_path: e.target.value })} />
                                <Button icon="pi pi-folder-open" className="p-button-secondary" onClick={async () => {
                                    const path = await window.electronAPI.selectFolder();
                                    if(path) saveSettings({ ...appSettings, library_path: path });
                                }}/>
                            </div>
                        </div>
                        <div className="flex flex-column gap-2">
                            <label className="font-bold">Output Path</label>
                            <div className="p-inputgroup">
                                <InputText value={appSettings.output_path} onChange={(e) => setAppSettings({ ...appSettings, output_path: e.target.value })} />
                                <Button icon="pi pi-folder-open" className="p-button-secondary" onClick={async () => {
                                    const path = await window.electronAPI.selectFolder();
                                    if(path) saveSettings({ ...appSettings, output_path: path });
                                }}/>
                            </div>
                        </div>
                        <div className="flex justify-content-end mt-4">
                            <Button label="Save Paths" icon="pi pi-save" onClick={() => saveSettings(appSettings)} />
                        </div>
                    </div>
                </TabPanel>

                {/* TAB 2: LANGUAGES */}
                <TabPanel header="Languages" leftIcon="pi pi-globe mr-2">
                    <div className="flex flex-column gap-4 p-2 h-full">
                        <div className="flex gap-2 align-items-end surface-ground p-3 border-round">
                            <div className="flex flex-column gap-1">
                                <label className="text-sm">Code (e.g. NL)</label>
                                <InputText value={newLangCode} onChange={(e) => setNewLangCode(e.target.value)} className="w-6rem" maxLength={2} placeholder="EN" />
                            </div>
                            <div className="flex flex-column gap-1 flex-grow-1">
                                <label className="text-sm">Label (e.g. Dutch)</label>
                                <InputText value={newLangLabel} onChange={(e) => setNewLangLabel(e.target.value)} placeholder="English" />
                            </div>
                            <Button label="Add" icon="pi pi-plus" onClick={addLanguage} disabled={!newLangCode || !newLangLabel} />
                        </div>

                        <div className="flex-grow-1 overflow-auto border-1 surface-border border-round">
                            <DataTable value={appSettings.languages} size="small" className="p-datatable-sm" emptyMessage="No languages defined.">
                                <Column field="code" header="Code" style={{width: '10%'}} />
                                <Column field="label" header="Label" />
                                <Column body={(row) => <Button icon="pi pi-trash" className="p-button-text p-button-danger p-button-sm" onClick={() => removeLanguage(row.code)} />} style={{width: '10%'}} />
                            </DataTable>
                        </div>
                    </div>
                </TabPanel>

                {/* TAB 3: TRANSLATIONS EDITOR */}
                <TabPanel header="Translations" leftIcon="pi pi-file-edit mr-2">
                    <div className="flex flex-column h-full">

                        {/* 1. TOP BAR: SCOPE & VIEW */}
                        <div className="flex gap-3 mb-3 p-3 surface-ground border-round">
                            <div className="flex-1 flex flex-column gap-2">
                                <label className="text-xs font-bold text-gray-400">FILE SCOPE</label>
                                <Dropdown
                                    value={selectedFolder} options={folders} onChange={(e) => setSelectedFolder(e.value)}
                                    optionLabel="name" itemTemplate={folderTemplate} valueTemplate={folderTemplate}
                                    className="w-full" placeholder="Select Scope" disabled={!appSettings.library_path}
                                />
                            </div>

                            <Divider layout="vertical" />

                            <div className="flex-1 flex flex-column gap-2">
                                <label className="text-xs font-bold text-gray-400">INDUSTRY VIEW</label>
                                <div className="flex gap-2">
                                    <Dropdown
                                        value={currentView}
                                        options={views}
                                        onChange={(e) => setCurrentView(e.value)}
                                        className="flex-grow-1"
                                    />
                                    {isAddingView ? (
                                        <div className="flex gap-1">
                                            <InputText value={newViewName} onChange={(e) => setNewViewName(e.target.value)} placeholder="Name..." className="w-8rem" autoFocus />
                                            <Button icon="pi pi-check" onClick={addNewView} className="p-button-success" />
                                            <Button icon="pi pi-times" onClick={() => setIsAddingView(false)} className="p-button-text" />
                                        </div>
                                    ) : (
                                        <Button icon="pi pi-plus" onClick={() => setIsAddingView(true)} tooltip="Add Industry View" className="p-button-outlined" />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 2. ACTIONS */}
                        <div className="flex justify-content-between align-items-center mb-2">
                            <span className="text-gray-400 text-sm">
                                Editing <strong>{currentView}</strong> keys in <strong>{selectedFolder?.name || '...'}</strong>
                            </span>
                            <div className="flex gap-2">
                                <Button label="Add Key" icon="pi pi-plus" size="small" onClick={addNewRow} className="p-button-outlined p-button-secondary" disabled={!selectedFolder} />
                                <Button label="Save Changes" icon="pi pi-save" size="small" onClick={saveTranslationFile} className="p-button-primary" disabled={!selectedFolder} />
                            </div>
                        </div>

                        {/* 3. GRID */}
                        <div className="flex-grow-1 overflow-auto border-1 surface-border border-round relative">
                            {loadingTrans && <div className="absolute top-0 left-0 w-full h-full bg-black-alpha-40 flex align-items-center justify-content-center z-5"><i className="pi pi-spin pi-spinner text-4xl"></i></div>}

                            <DataTable value={rows} size="small" scrollable scrollHeight="flex" className="p-datatable-sm" rowHover stripedRows emptyMessage="No keys found. Add languages in the previous tab, then add keys here.">
                                <Column
                                    field="key"
                                    header="Placeholder Key"
                                    style={{ width: '20%' }}
                                    frozen
                                    body={(row) => <InputText value={row.key} onChange={(e) => updateRowKey(row.id, e.target.value)} className="w-full p-inputtext-sm font-bold border-none bg-transparent"/>}
                                />
                                {appSettings.languages.map(lang => (
                                    <Column
                                        key={lang.code}
                                        header={lang.label}
                                        body={(row) => (
                                            <InputText
                                                value={row[lang.code] || ''}
                                                onChange={(e) => updateRowVal(row.id, lang.code, e.target.value)}
                                                className="w-full p-inputtext-sm border-none bg-transparent"
                                                placeholder="..."
                                            />
                                        )}
                                    />
                                ))}
                                <Column
                                    body={(row) => <Button icon="pi pi-trash" className="p-button-rounded p-button-text p-button-danger p-button-sm" onClick={() => setRows(rows.filter(r => r.id !== row.id))} />}
                                    style={{ width: '50px' }}
                                    alignHeader={'center'}
                                />
                            </DataTable>
                        </div>

                    </div>
                </TabPanel>
            </TabView>
        </Dialog>
    );
}