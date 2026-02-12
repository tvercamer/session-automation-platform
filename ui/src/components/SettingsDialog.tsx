import { useState, useEffect, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Chips } from 'primereact/chips';
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
interface KeyLabel {
    code: string;
    label: string;
    matches?: string[];
}

interface AppSettings {
    library_path: string;
    output_path: string;
    hubspot_api_key: string; // NIEUW
    languages: KeyLabel[];
    industries: KeyLabel[];
}

interface FolderOption {
    name: string;
    path: string;
    hasFile: boolean;
    isRoot: boolean;
}

interface TransRow {
    id: string;
    key: string;
    [langCode: string]: string;
}

// --- CONSTANTS ---
const DEFAULT_LANG: KeyLabel = { code: 'EN', label: 'English' };
const DEFAULT_IND: KeyLabel = { code: 'gen', label: 'Generic' };

export default function SettingsDialog({ visible, onHide, onSettingsChanged }: SettingsDialogProps) {
    const toast = useRef<Toast>(null);

    // --- GLOBAL SETTINGS ---
    const [appSettings, setAppSettings] = useState<AppSettings>({
        library_path: '', output_path: '', hubspot_api_key: '', languages: [], industries: []
    });

    // --- MANAGERS STATE ---
    const [newLangCode, setNewLangCode] = useState('');
    const [newLangLabel, setNewLangLabel] = useState('');
    const [newIndCode, setNewIndCode] = useState('');
    const [newIndLabel, setNewIndLabel] = useState('');

    // --- TRANSLATION EDITOR STATE ---
    const [folders, setFolders] = useState<FolderOption[]>([]);
    const [selectedFolder, setSelectedFolder] = useState<FolderOption | null>(null);
    const [fileData, setFileData] = useState<any>({});
    const [currentView, setCurrentView] = useState<string>('Generic');
    const [rows, setRows] = useState<TransRow[]>([]);
    const [loadingTrans, setLoadingTrans] = useState(false);

    // --- LOAD ON OPEN ---
    useEffect(() => {
        if (visible) loadGeneralSettings();
    }, [visible]);

    const loadGeneralSettings = async () => {
        try {
            let settings = await window.electronAPI.getSettings();

            // Ensure Defaults exist in UI logic
            if (!settings.languages) settings.languages = [];
            if (!settings.industries) settings.industries = [];

            // Enforce Default Language (EN)
            if (!settings.languages.find((l: KeyLabel) => l.code === DEFAULT_LANG.code)) {
                settings.languages.unshift(DEFAULT_LANG);
            }

            // Enforce Default Industry (gen)
            if (!settings.industries.find((i: KeyLabel) => i.code === DEFAULT_IND.code)) {
                settings.industries.unshift(DEFAULT_IND);
            }

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
            if (!selectedFolder && list.length > 0) setSelectedFolder(list[0]);
        } catch (e) { console.error(e); }
    };

    // --- TRANSLATION LOGIC ---
    useEffect(() => {
        if (selectedFolder && visible) loadFile(selectedFolder.path);
    }, [selectedFolder, visible]);

    const loadFile = async (targetPath: string) => {
        setLoadingTrans(true);
        try {
            const data = await window.electronAPI.loadTrans(targetPath);
            setFileData(data);
            setCurrentView('Generic');
            parseRowsForView(data, 'Generic');
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingTrans(false);
        }
    };

    const parseRowsForView = (data: any, view: string) => {
        const newRows: TransRow[] = [];
        Object.entries(data).forEach(([key, content]: [string, any], index) => {
            const row: TransRow = { id: `row-${index}-${Date.now()}`, key: key };

            if (view === 'Generic') {
                const defaults = content.default || {};
                appSettings.languages.forEach(lang => {
                    row[lang.code] = defaults[lang.code] || '';
                });
            } else {
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

    useEffect(() => {
        if (fileData) parseRowsForView(fileData, currentView);
    }, [currentView]);

    // --- ACTIONS ---
    const saveSettings = async (newSettings: AppSettings) => {
        try {
            await window.electronAPI.saveSettings(newSettings);
            setAppSettings(newSettings);
            toast.current?.show({severity:'success', summary:'Saved', detail:'Settings updated'});
            if(onSettingsChanged) onSettingsChanged();
        } catch (e) { toast.current?.show({severity:'error', summary:'Error', detail:'Failed'}); }
    };

    // Managers
    const addLanguage = () => {
        if (!newLangCode || !newLangLabel) return;
        const code = newLangCode.toUpperCase();
        if (appSettings.languages.find(l => l.code === code)) return;
        const updated = { ...appSettings, languages: [...appSettings.languages, { code, label: newLangLabel }] };
        saveSettings(updated);
        setNewLangCode(''); setNewLangLabel('');
    };

    const removeLanguage = (code: string) => {
        if (code === DEFAULT_LANG.code) return;
        saveSettings({ ...appSettings, languages: appSettings.languages.filter(l => l.code !== code) });
    };

    const addIndustry = () => {
        if (!newIndCode || !newIndLabel) return;
        const code = newIndCode.toLowerCase();
        if (appSettings.industries.find(i => i.code === code)) return;
        const updated = { ...appSettings, industries: [...appSettings.industries, { code, label: newIndLabel }] };
        saveSettings(updated);
        setNewIndCode(''); setNewIndLabel('');
    };

    const removeIndustry = (code: string) => {
        if (code === DEFAULT_IND.code) return;
        saveSettings({ ...appSettings, industries: appSettings.industries.filter(i => i.code !== code) });
    };

    const updateIndustryMatches = (code: string, newMatches: string[]) => {
        const updatedInds = appSettings.industries.map(ind =>
            ind.code === code ? { ...ind, matches: newMatches } : ind
        );
        saveSettings({ ...appSettings, industries: updatedInds });
    };

    // Save Translation File
    const saveTranslationFile = async () => {
        if (!selectedFolder) return;
        const updatedData = JSON.parse(JSON.stringify(fileData));

        rows.forEach(row => {
            if (!row.key.trim()) return;
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

        try {
            await window.electronAPI.saveTrans(selectedFolder.path, updatedData);
            setFileData(updatedData);
            toast.current?.show({severity:'success', summary:'Saved', detail:`Saved to ${selectedFolder.name}`});
            loadFolderList(appSettings.library_path);
        } catch (e) { toast.current?.show({severity:'error', summary:'Error', detail:'Failed'}); }
    };

    // --- TEMPLATES ---
    const folderTemplate = (option: FolderOption) => (
        <div className="flex align-items-center justify-content-between w-full">
            <span>{option.name}</span>
            {option.hasFile && <Tag value={option.isRoot ? "Master" : "Override"} severity={option.isRoot ? "success" : "info"} className="ml-2 text-xs" />}
        </div>
    );

    const viewOptions = appSettings.industries.map(ind => ({
        label: ind.code === 'gen' ? 'Generic (Default)' : ind.label,
        value: ind.code === 'gen' ? 'Generic' : ind.code
    }));

    const isDefaultRow = (data: any) => data.code === DEFAULT_LANG.code || data.code === DEFAULT_IND.code;

    return (
        <Dialog header="Settings" visible={visible} style={{ width: '75vw', height: '90vh' }} onHide={onHide} contentClassName="flex flex-column">
            <Toast ref={toast} />
            <TabView className="flex-grow-1 flex flex-column">

                {/* 1. GENERAL */}
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

                        {/* NIEUW: HubSpot API Key */}
                        <div className="flex flex-column gap-2">
                            <label className="font-bold">HubSpot Access Token</label>
                            <div className="p-inputgroup">
                                <span className="p-inputgroup-addon">
                                    <i className="pi pi-key"></i>
                                </span>
                                <InputText
                                    type="password"
                                    value={appSettings.hubspot_api_key || ''}
                                    onChange={(e) => setAppSettings({ ...appSettings, hubspot_api_key: e.target.value })}
                                    placeholder="pat-na1-..."
                                />
                            </div>
                            <small className="text-gray-400">Enter your Private App Access Token to load companies.</small>
                            <div className="flex justify-content-end">
                                <Button label="Save Token" icon="pi pi-save" className="p-button-sm" onClick={() => saveSettings(appSettings)} />
                            </div>
                        </div>
                    </div>
                </TabPanel>

                {/* 2. LANGUAGES */}
                <TabPanel header="Languages" leftIcon="pi pi-globe mr-2">
                    <div className="flex flex-column gap-4 p-2 h-full">
                        <div className="flex gap-2 align-items-end surface-ground p-3 border-round">
                            <div className="flex flex-column gap-1">
                                <label className="text-sm">Code (e.g. NL)</label>
                                <InputText value={newLangCode} onChange={(e) => setNewLangCode(e.target.value)} className="w-6rem" maxLength={2} placeholder="NL" />
                            </div>
                            <div className="flex flex-column gap-1 flex-grow-1">
                                <label className="text-sm">Label (e.g. Dutch)</label>
                                <InputText value={newLangLabel} onChange={(e) => setNewLangLabel(e.target.value)} placeholder="Nederlands" />
                            </div>
                            <Button label="Add" icon="pi pi-plus" onClick={addLanguage} disabled={!newLangCode || !newLangLabel} />
                        </div>
                        <div className="flex-grow-1 overflow-auto border-1 surface-border border-round">
                            <DataTable value={appSettings.languages} size="small" className="p-datatable-sm" rowClassName={(data) => isDefaultRow(data) ? 'bg-gray-50' : ''}>
                                <Column field="code" header="Code" style={{width: '10%'}} body={(row) => <span className={row.code === 'EN' ? 'font-bold' : ''}>{row.code}</span>} />
                                <Column field="label" header="Label" />
                                <Column body={(row) => (
                                    row.code !== DEFAULT_LANG.code && (
                                        <Button icon="pi pi-trash" className="p-button-text p-button-danger p-button-sm" onClick={() => removeLanguage(row.code)} />
                                    )
                                )} style={{width: '10%'}} />
                            </DataTable>
                        </div>
                    </div>
                </TabPanel>

                {/* 3. INDUSTRIES */}
                <TabPanel header="Industries" leftIcon="pi pi-briefcase mr-2">
                    <div className="flex flex-column gap-4 p-2 h-full">
                        <div className="flex gap-2 align-items-end surface-ground p-3 border-round">
                            <div className="flex flex-column gap-1">
                                <label className="text-sm">Key (e.g. healthcare)</label>
                                <InputText value={newIndCode} onChange={(e) => setNewIndCode(e.target.value)} className="w-10rem" placeholder="finance" />
                            </div>
                            <div className="flex flex-column gap-1 flex-grow-1">
                                <label className="text-sm">Label (e.g. Healthcare)</label>
                                <InputText value={newIndLabel} onChange={(e) => setNewIndLabel(e.target.value)} placeholder="Finance Sector" />
                            </div>
                            <Button label="Add" icon="pi pi-plus" onClick={addIndustry} disabled={!newIndCode || !newIndLabel} />
                        </div>
                        <div className="flex-grow-1 overflow-auto border-1 surface-border border-round">
                            <DataTable value={appSettings.industries} size="small" className="p-datatable-sm" rowClassName={(data) => isDefaultRow(data) ? 'bg-gray-50' : ''}>
                                <Column field="code" header="Key" style={{width: '20%'}} body={(row) => <span className={row.code === 'gen' ? 'font-bold' : ''}>{row.code}</span>} />
                                <Column field="label" header="Label" />
                                <Column header="HubSpot Mappings" body={(row) => (
                                    <Chips
                                        value={row.matches || []}
                                        onChange={(e) => updateIndustryMatches(row.code, e.value || [])}
                                        className="p-inputtext-sm w-full"
                                        placeholder={row.code === 'gen' ? "Fallback..." : "Map HubSpot industries..."}
                                        disabled={row.code === 'gen'}
                                    />
                                )} />
                                <Column body={(row) => (
                                    row.code !== DEFAULT_IND.code && (
                                        <Button icon="pi pi-trash" className="p-button-text p-button-danger p-button-sm" onClick={() => removeIndustry(row.code)} />
                                    )
                                )} style={{width: '10%'}} />
                            </DataTable>
                        </div>
                    </div>
                </TabPanel>

                {/* 4. TRANSLATIONS EDITOR */}
                <TabPanel header="Translations" leftIcon="pi pi-file-edit mr-2">
                    <div className="flex flex-column h-full">
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
                                <Dropdown
                                    value={currentView} options={viewOptions} onChange={(e) => setCurrentView(e.value)}
                                    className="w-full" placeholder="Select View"
                                />
                            </div>
                        </div>

                        <div className="flex justify-content-between align-items-center mb-2">
                            <span className="text-gray-400 text-sm">
                                Editing <strong>{viewOptions.find(v => v.value === currentView)?.label}</strong> keys in <strong>{selectedFolder?.name || '...'}</strong>
                            </span>
                            <div className="flex gap-2">
                                <Button label="Add Key" icon="pi pi-plus" size="small" onClick={() => {
                                    const newRow: TransRow = { id: `new-${Date.now()}`, key: '' };
                                    appSettings.languages.forEach(l => newRow[l.code] = '');
                                    setRows([newRow, ...rows]);
                                }} className="p-button-outlined p-button-secondary" disabled={!selectedFolder} />
                                <Button label="Save Changes" icon="pi pi-save" size="small" onClick={saveTranslationFile} className="p-button-primary" disabled={!selectedFolder} />
                            </div>
                        </div>

                        <div className="flex-grow-1 overflow-auto border-1 surface-border border-round relative">
                            {loadingTrans && <div className="absolute top-0 left-0 w-full h-full bg-black-alpha-40 flex align-items-center justify-content-center z-5"><i className="pi pi-spin pi-spinner text-4xl"></i></div>}

                            <DataTable value={rows} size="small" scrollable scrollHeight="flex" className="p-datatable-sm" rowHover stripedRows emptyMessage="No keys. Define languages first.">
                                <Column
                                    field="key" header="Placeholder Key" style={{ width: '20%' }} frozen
                                    body={(row) => <InputText value={row.key} onChange={(e) => setRows(rows.map(r => r.id === row.id ? { ...r, key: e.target.value } : r))} className="w-full p-inputtext-sm font-bold border-none bg-transparent"/>}
                                />
                                {appSettings.languages.map(lang => (
                                    <Column key={lang.code} header={lang.label}
                                            body={(row) => (
                                                <InputText
                                                    value={row[lang.code] || ''}
                                                    onChange={(e) => setRows(rows.map(r => r.id === row.id ? { ...r, [lang.code]: e.target.value } : r))}
                                                    className="w-full p-inputtext-sm border-none bg-transparent" placeholder="..."
                                                />
                                            )}
                                    />
                                ))}
                                <Column body={(row) => <Button icon="pi pi-trash" className="p-button-rounded p-button-text p-button-danger p-button-sm" onClick={() => setRows(rows.filter(r => r.id !== row.id))} />} style={{ width: '50px' }} alignHeader={'center'} />
                            </DataTable>
                        </div>
                    </div>
                </TabPanel>
            </TabView>
        </Dialog>
    );
}