import { useState } from 'react';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import {RadioButton} from "primereact/radiobutton";
import { type AppSettings } from '../../types/settings';

interface LanguageTabProps {
    settings: AppSettings;
    onUpdate: (settings: AppSettings) => void;
}

export default function LanguageTab({ settings, onUpdate }: LanguageTabProps) {
    const [code, setCode] = useState('');
    const [label, setLabel] = useState('');

    const add = () => {
        if (!code || !label) return;
        const upperCode = code.toUpperCase();
        if (settings.languages.find(l => l.code === upperCode)) return;
        const isFirst = settings.languages.length === 0;

        const newLang = { code: upperCode, label, isDefault: isFirst };

        onUpdate({
            ...settings,
            languages: [...settings.languages, newLang]
        });
        setCode('');
        setLabel('');
    };

    const remove = (targetCode: string) => {
        const updated = settings.languages.filter(l => l.code !== targetCode);

        // Safety: If we deleted the default, make the first remaining item the new default
        // Normally we should never need this as the UI doesn't allow deleting the default.
        if (updated.length > 0 && !updated.find(l => l.isDefault)) {
            updated[0].isDefault = true;
        }

        onUpdate({ ...settings, languages: updated });
    };

    const setDefault = (targetCode: string) => {
        const updated = settings.languages.map(l => ({
            ...l,
            isDefault: l.code === targetCode
        }));
        onUpdate({ ...settings, languages: updated });
    };

    return (
        <div className="flex flex-column gap-4 p-2 h-full">
            {/* Input Row */}
            <div className="flex gap-2 align-items-end surface-ground p-3 border-round">
                <div className="flex flex-column gap-1">
                    <label className="text-xs font-bold text-gray-400">Code</label>
                    <InputText value={code} onChange={(e) => setCode(e.target.value)} className="w-6rem p-inputtext-sm" maxLength={2} placeholder="NL" />
                </div>
                <div className="flex flex-column gap-1 flex-grow-1">
                    <label className="text-xs font-bold text-gray-400">Label</label>
                    <InputText value={label} onChange={(e) => setLabel(e.target.value)} className="p-inputtext-sm" placeholder="Dutch" />
                </div>
                <Button label="Add" icon="pi pi-plus" size="small" onClick={add} disabled={!code || !label} />
            </div>

            {/* List */}
            <div className="flex-grow-1 overflow-auto border-1 surface-border border-round">
                <DataTable value={settings.languages} size="small" className="p-datatable-sm">
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
                    <Column field="code" header="Code" style={{ width: '15%' }} body={(row) => <span className="font-mono text-sm">{row.code}</span>} />
                    <Column field="label" header="Label" />
                    <Column body={(row) => (
                        <Button
                            icon="pi pi-trash"
                            text
                            severity="danger"
                            size="small"
                            onClick={() => remove(row.code)}
                            disabled={row.isDefault}
                            tooltip={row.isDefault ? "Set another default before deleting" : "Delete"}
                            tooltipOptions={{ position: 'left' }}
                        />
                    )} style={{ width: '50px' }} />
                </DataTable>
            </div>
        </div>
    );
}