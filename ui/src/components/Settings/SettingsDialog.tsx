import { useState, useEffect, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { TabView, TabPanel } from 'primereact/tabview';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';

import { type AppSettings, DEFAULT_LANG, DEFAULT_IND } from '../../types/settings';
import GeneralTab from './GeneralTab';
import LanguageTab from './LanguageTab';
import IndustryTab from './IndustryTab';
import TranslationTab from './TranslationTab';

interface SettingsDialogProps {
    visible: boolean;
    onHide: () => void;
    onSettingsChanged?: () => void;
}

export default function SettingsDialog({ visible, onHide, onSettingsChanged }: SettingsDialogProps) {
    const toast = useRef<Toast>(null);

    // Initial State
    const [settings, setSettings] = useState<AppSettings>({
        library_path: '', output_path: '', hubspot_api_key: '', languages: [], industries: []
    });

    // Load Settings on Open
    useEffect(() => {
        if (visible) {
            window.electronAPI.getSettings().then((data: any) => {
                // Ensure defaults exist
                if (!data.languages) data.languages = [];
                if (!data.industries) data.industries = [];

                if (!data.languages.find((l: any) => l.code === DEFAULT_LANG.code)) {
                    data.languages.unshift(DEFAULT_LANG);
                }
                if (!data.industries.find((i: any) => i.code === DEFAULT_IND.code)) {
                    data.industries.unshift(DEFAULT_IND);
                }
                setSettings(data);
            });
        }
    }, [visible]);

    const handleSave = async (newSettings: AppSettings) => {
        try {
            await window.electronAPI.saveSettings(newSettings);
            setSettings(newSettings);
            toast.current?.show({ severity: 'success', summary: 'Saved', detail: 'Configuration updated' });
            if (onSettingsChanged) onSettingsChanged();
        } catch (e) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to save settings' });
        }
    };

    return (
        <Dialog
            header="Settings"
            visible={visible}
            style={{ width: '80vw', height: '90vh' }}
            onHide={onHide}
            contentClassName="flex flex-column p-0"
        >
            <Toast ref={toast} />
            <TabView className="flex-grow-1 flex flex-column h-full">

                <TabPanel header="General" leftIcon="pi pi-cog mr-2">
                    <GeneralTab settings={settings} onUpdate={handleSave} />
                </TabPanel>

                <TabPanel header="Languages" leftIcon="pi pi-globe mr-2">
                    <LanguageTab settings={settings} onUpdate={handleSave} />
                </TabPanel>

                <TabPanel header="Industries" leftIcon="pi pi-briefcase mr-2">
                    <IndustryTab settings={settings} onUpdate={handleSave} />
                </TabPanel>

                <TabPanel header="Translations" leftIcon="pi pi-file-edit mr-2">
                    <TranslationTab settings={settings} />
                </TabPanel>

            </TabView>

            <div className="flex justify-content-end p-3 surface-ground border-top-1 surface-border">
                <Button label="Close" icon="pi pi-check" onClick={onHide} />
            </div>
        </Dialog>
    );
}