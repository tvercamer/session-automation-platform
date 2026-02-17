import { useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Chips } from 'primereact/chips';
import { type AppSettings, DEFAULT_IND } from '../../types/settings';

interface IndustryTabProps {
    settings: AppSettings;
    onUpdate: (settings: AppSettings) => void;
}

export default function IndustryTab({ settings, onUpdate }: IndustryTabProps) {
    const [code, setCode] = useState('');
    const [label, setLabel] = useState('');

    const add = () => {
        if (!code || !label) return;
        const lowerCode = code.toLowerCase();
        if (settings.industries.find(i => i.code === lowerCode)) return;

        onUpdate({
            ...settings,
            industries: [...settings.industries, { code: lowerCode, label }]
        });
        setCode('');
        setLabel('');
    };

    const remove = (targetCode: string) => {
        if (targetCode === DEFAULT_IND.code) return;
        onUpdate({
            ...settings,
            industries: settings.industries.filter(i => i.code !== targetCode)
        });
    };

    const updateMatches = (targetCode: string, matches: string[]) => {
        onUpdate({
            ...settings,
            industries: settings.industries.map(i => i.code === targetCode ? { ...i, matches } : i)
        });
    };

    return (
        <div className="flex flex-column gap-4 p-2 h-full">
            {/* Input Row */}
            <div className="flex gap-2 align-items-end surface-ground p-3 border-round">
                <div className="flex flex-column gap-1">
                    <label className="text-xs font-bold text-gray-400">Key</label>
                    <InputText value={code} onChange={(e) => setCode(e.target.value)} className="w-8rem p-inputtext-sm" placeholder="finance" />
                </div>
                <div className="flex flex-column gap-1 flex-grow-1">
                    <label className="text-xs font-bold text-gray-400">Label</label>
                    <InputText value={label} onChange={(e) => setLabel(e.target.value)} className="p-inputtext-sm" placeholder="Finance Sector" />
                </div>
                <Button label="Add" icon="pi pi-plus" size="small" onClick={add} disabled={!code || !label} />
            </div>

            {/* List */}
            <div className="flex-grow-1 overflow-auto border-1 surface-border border-round">
                <DataTable value={settings.industries} size="small" className="p-datatable-sm">
                    <Column field="code" header="Key" style={{ width: '15%' }} body={(row) => <span className="font-mono text-sm">{row.code}</span>} />
                    <Column field="label" header="Label" style={{ width: '25%' }} />
                    <Column header="HubSpot Mappings" body={(row) => (
                        <Chips
                            value={row.matches || []}
                            onChange={(e) => updateMatches(row.code, e.value || [])}
                            className="p-inputtext-sm w-full block"
                            placeholder={row.code === 'gen' ? "Fallback..." : "Map HubSpot industries..."}
                            disabled={row.code === 'gen'}
                        />
                    )} />
                    <Column body={(row) => (
                        row.code !== DEFAULT_IND.code && (
                            <Button icon="pi pi-trash" text severity="danger" size="small" onClick={() => remove(row.code)} />
                        )
                    )} style={{ width: '50px' }} />
                </DataTable>
            </div>
        </div>
    );
}