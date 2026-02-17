import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import type {AppSettings} from '../../types/settings';

interface GeneralTabProps {
    settings: AppSettings;
    onUpdate: (settings: AppSettings) => void;
}

export default function GeneralTab({ settings, onUpdate }: GeneralTabProps) {

    const selectFolder = async (field: 'library_path' | 'output_path') => {
        const path = await window.electronAPI.selectFolder();
        if (path) onUpdate({ ...settings, [field]: path });
    };

    return (
        <div className="flex flex-column gap-4 p-2">
            {/* Library Path */}
            <div className="flex flex-column gap-2">
                <label className="font-bold text-sm text-gray-300">Library Path</label>
                <div className="p-inputgroup">
                    <InputText
                        value={settings.library_path}
                        onChange={(e) => onUpdate({ ...settings, library_path: e.target.value })}
                        className="p-inputtext-sm"
                    />
                    <Button icon="pi pi-folder-open" severity="secondary" onClick={() => selectFolder('library_path')} />
                </div>
            </div>

            {/* Output Path */}
            <div className="flex flex-column gap-2">
                <label className="font-bold text-sm text-gray-300">Output Path</label>
                <div className="p-inputgroup">
                    <InputText
                        value={settings.output_path}
                        onChange={(e) => onUpdate({ ...settings, output_path: e.target.value })}
                        className="p-inputtext-sm"
                    />
                    <Button icon="pi pi-folder-open" severity="secondary" onClick={() => selectFolder('output_path')} />
                </div>
            </div>

            {/* HubSpot Key */}
            <div className="flex flex-column gap-2">
                <label className="font-bold text-sm text-gray-300">HubSpot Access Token</label>
                <div className="p-inputgroup">
                    <span className="p-inputgroup-addon">
                        <i className="pi pi-key"></i>
                    </span>
                    <InputText
                        type="password"
                        value={settings.hubspot_api_key || ''}
                        onChange={(e) => onUpdate({ ...settings, hubspot_api_key: e.target.value })}
                        placeholder="pat-na1-..."
                        className="p-inputtext-sm"
                    />
                </div>
                <small className="text-gray-500">Enter your Private App Access Token to load companies.</small>
            </div>
        </div>
    );
}