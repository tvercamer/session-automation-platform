import { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { TabView, TabPanel } from 'primereact/tabview';

interface SettingsDialogProps {
    visible: boolean;
    onHide: () => void;
    onSettingsChanged?: () => void;
}

export default function SettingsDialog({ visible, onHide, onSettingsChanged }: SettingsDialogProps) {
    const [libraryPath, setLibraryPath] = useState('');
    const [outputPath, setOutputPath] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible) {
            setLoading(true);
            window.electronAPI.getSettings()
                .then((data: any) => {
                    if (data && !data.error) {
                        setLibraryPath(data.library_path || '');
                        setOutputPath(data.output_path || '');
                    }
                })
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [visible]);

    const handleSave = async () => {
        setLoading(true);
        try {
            await window.electronAPI.saveSettings({
                library_path: libraryPath,
                output_path: outputPath
            });

            if (onSettingsChanged) onSettingsChanged();
            onHide();
        } catch (error) {
            console.error("Failed to save settings:", error);
        } finally {
            setLoading(false);
        }
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
            <Button label="Save" icon="pi pi-check" onClick={handleSave} loading={loading} autoFocus />
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
                            <div className="p-inputgroup flex align-items-stretch w-full">
                                <InputText
                                    id="libPath"
                                    value={libraryPath}
                                    onChange={(e) => setLibraryPath(e.target.value)}
                                    placeholder="Select folder..."
                                    className="w-full"
                                    disabled={loading}
                                />
                                <Button icon="pi pi-folder-open" onClick={handleBrowseLibrary} disabled={loading} className="flex-shrink-0" />
                            </div>
                            <small className="text-gray-400">Folder containing your templates.</small>
                        </div>

                        {/* Output Path */}
                        <div className="flex flex-column gap-2">
                            <label htmlFor="outPath" className="font-bold">Default Output Location</label>
                            <div className="p-inputgroup flex align-items-stretch w-full">
                                <InputText
                                    id="outPath"
                                    value={outputPath}
                                    onChange={(e) => setOutputPath(e.target.value)}
                                    placeholder="Select folder..."
                                    className="w-full"
                                    disabled={loading}
                                />
                                <Button icon="pi pi-folder-open" onClick={handleBrowseOutput} disabled={loading} className="flex-shrink-0" />
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