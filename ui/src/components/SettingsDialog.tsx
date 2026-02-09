import { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { TabView, TabPanel } from 'primereact/tabview';

interface SettingsDialogProps {
    visible: boolean;
    onHide: () => void;
}

export default function SettingsDialog({ visible, onHide }: SettingsDialogProps) {
    const [libraryPath, setLibraryPath] = useState('');
    const [outputPath, setOutputPath] = useState('');

    useEffect(() => {
        if (visible) {
            setLibraryPath(localStorage.getItem('settings_libraryPath') || '');
            setOutputPath(localStorage.getItem('settings_outputPath') || '');
        }
    }, [visible]);

    const handleSave = () => {
        localStorage.setItem('settings_libraryPath', libraryPath);
        localStorage.setItem('settings_outputPath', outputPath);
        onHide();
    };

    const handleBrowseLibrary = async () => {
        const path = await window.electronAPI.selectFolder();
        if (path) setLibraryPath(path);
    };

    const handleBrowseOutput = async () => {
        const path = await window.electronAPI.selectFolder();
        if (path) setOutputPath(path);
    };

    const footer = (
        <div>
            <Button label="Cancel" icon="pi pi-times" onClick={onHide} className="p-button-text" />
            <Button label="Save" icon="pi pi-check" onClick={handleSave} autoFocus />
        </div>
    );

    return (
        <Dialog
            header="Settings"
            visible={visible}
            style={{ width: '50vw' }}
            footer={footer}
            onHide={onHide}
            draggable={false}
            resizable={false}
        >
            <TabView>
                <TabPanel header="General" leftIcon="pi pi-cog">
                    <div className="flex flex-column gap-4 pt-2">

                        {/* Library Path */}
                        <div className="flex flex-column gap-2">
                            <label htmlFor="libPath" className="font-bold">Library Location</label>

                            {/* FIX: added 'flex align-items-stretch' to force equal height */}
                            <div className="p-inputgroup flex align-items-stretch w-full">
                                <InputText
                                    id="libPath"
                                    value={libraryPath}
                                    onChange={(e) => setLibraryPath(e.target.value)}
                                    placeholder="Select folder..."
                                    className="w-full" // Ensures input takes up all space
                                />
                                <Button
                                    icon="pi pi-folder-open"
                                    onClick={handleBrowseLibrary}
                                    className="flex-shrink-0" // Prevents button from being squashed
                                />
                            </div>
                            <small className="text-gray-400">Folder containing your templates.</small>
                        </div>

                        {/* Output Path */}
                        <div className="flex flex-column gap-2">
                            <label htmlFor="outPath" className="font-bold">Default Output Location</label>

                            {/* FIX: added 'flex align-items-stretch' */}
                            <div className="p-inputgroup flex align-items-stretch w-full">
                                <InputText
                                    id="outPath"
                                    value={outputPath}
                                    onChange={(e) => setOutputPath(e.target.value)}
                                    placeholder="Select folder..."
                                    className="w-full"
                                />
                                <Button
                                    icon="pi pi-folder-open"
                                    onClick={handleBrowseOutput}
                                    className="flex-shrink-0"
                                />
                            </div>
                            <small className="text-gray-400">Where generated sessions will be saved.</small>
                        </div>
                    </div>
                </TabPanel>

                <TabPanel header="Translations" leftIcon="pi pi-language">
                    <div className="p-4 text-center border-dashed border-1 border-round surface-border">
                        <i className="pi pi-wrench text-2xl text-gray-400 mb-2"></i>
                        <p className="m-0 text-gray-400">Translations Module</p>
                        <small className="text-gray-500">Feature coming soon...</small>
                    </div>
                </TabPanel>
            </TabView>
        </Dialog>
    );
}