import { useState } from 'react';
import { Chips } from 'primereact/chips';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { RadioButton } from 'primereact/radiobutton';
import { type AppSettings } from '../../types/settings';

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
        const isFirst = settings.industries.length === 0;

        const newInd = {
            code: lowerCode,
            label,
            matches: [],
            isDefault: isFirst
        };

        onUpdate({
            ...settings,
            industries: [...settings.industries, newInd]
        });
        setCode('');
        setLabel('');
    };

    const remove = (targetCode: string) => {
        const updated = settings.industries.filter(i => i.code !== targetCode);

        // Safety: ensure one default remains
        if (updated.length > 0 && !updated.find(i => i.isDefault)) {
            updated[0].isDefault = true;
        }

        onUpdate({ ...settings, industries: updated });
    };

    const updateMatches = (targetCode: string, matches: string[]) => {
        onUpdate({
            ...settings,
            industries: settings.industries.map(i => i.code === targetCode ? { ...i, matches } : i)
        });
    };

    const setDefault = (targetCode: string) => {
        const updated = settings.industries.map(i => ({
            ...i,
            isDefault: i.code === targetCode
        }));
        onUpdate({ ...settings, industries: updated });
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
                    <Column
                        header="Default"
                        body={(row) => (
                            <div className="flex justify-content-center">
                                <RadioButton
                                    checked={!!row.isDefault}
                                    onChange={() => setDefault(row.code)}
                                />
                            </div>
                        )}
                        style={{ width: '4rem', textAlign: 'center' }}
                    />
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
                        <Button
                            icon="pi pi-trash"
                            text
                            severity="danger"
                            size="small"
                            onClick={() => remove(row.code)}
                            disabled={row.isDefault}
                            tooltip={row.isDefault ? "Cannot delete default" : "Delete"}
                            tooltipOptions={{ position: 'left' }}
                        />
                    )} style={{ width: '50px' }} />
                </DataTable>
            </div>
        </div>
    );
}