import { useState, useEffect } from 'react';
import type { SessionSettings } from "../types/session.ts";
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';

interface ConfigurationPanelProps {
    settings: SessionSettings;
    onChange: (field: keyof SessionSettings, value: any) => void;
}

interface KeyLabel {
    code: string;
    label: string;
}

export default function ConfigurationPanel({ settings, onChange }: ConfigurationPanelProps) {
    const { sessionName, customer, date, industry, language } = settings;

    // --- STATE ---
    const [availableLanguages, setAvailableLanguages] = useState<KeyLabel[]>([]);
    const [availableIndustries, setAvailableIndustries] = useState<KeyLabel[]>([]);

    // Mock Customers (Hardcoded for now)
    const customers = [
        { name: 'Acme Corp', code: 'ACME' },
        { name: 'Globex', code: 'GLBX' }
    ];

    // --- LOAD DYNAMIC LISTS & SET DEFAULTS ---
    useEffect(() => {
        async function loadLists() {
            try {
                const appSettings = await window.electronAPI.getSettings();

                // 1. Haal lijsten op of gebruik lege arrays
                let langs: KeyLabel[] = appSettings.languages || [];
                let inds: KeyLabel[] = appSettings.industries || [];

                // 2. Definieer Defaults
                const defaultLang = { code: 'EN', label: 'English' };
                const defaultInd = { code: 'gen', label: 'Generic' };

                // 3. Zorg dat de defaults altijd in de lijst staan (fallback)
                if (!langs.find(l => l.code === 'EN')) {
                    langs.unshift(defaultLang);
                }
                if (!inds.find(i => i.code === 'gen')) {
                    inds.unshift(defaultInd);
                }

                setAvailableLanguages(langs);
                setAvailableIndustries(inds);

                // --- AUTO-SELECT LOGICA ---

                // Als er nog geen taal is geselecteerd in settings, kies 'EN'
                if (!language) {
                    const enOption = langs.find(l => l.code === 'EN');
                    if (enOption) onChange('language', enOption);
                }

                // Als er nog geen industrie is geselecteerd in settings, kies 'gen'
                if (!industry) {
                    const genOption = inds.find(i => i.code === 'gen');
                    if (genOption) onChange('industry', genOption);
                }

            } catch (e) {
                console.error("Failed to load settings for configuration panel", e);
            }
        }
        loadLists();
    }, []); // Run once on mount

    return (
        <div className="flex-1 surface-ground flex flex-column h-full surface-border">
            {/* Header */}
            <div className="flex align-items-center p-2 px-3 bg-header" style={{ height: '3rem' }}>
                <span className="font-bold text-sm text-gray-200">Session Configuration</span>
            </div>

            {/* Form */}
            <div className="flex flex-column gap-4 p-3 overflow-y-auto">

                {/* Session Name */}
                <div className="flex flex-column gap-2">
                    <label htmlFor="sname" className="text-xs font-medium text-gray-400">SESSION NAME</label>
                    <InputText
                        id="sname"
                        value={sessionName}
                        onChange={(e) => onChange('sessionName', e.target.value)}
                        placeholder="e.g. Q1 Review"
                        className="p-inputtext-sm"
                    />
                </div>

                {/* Customer */}
                <div className="flex flex-column gap-2">
                    <label className="text-xs font-medium text-gray-400">CUSTOMER</label>
                    <Dropdown
                        value={customer}
                        onChange={(e) => onChange('customer', e.value)}
                        options={customers}
                        optionLabel="name"
                        placeholder="Select a Customer"
                        className="p-inputtext-sm"
                    />
                </div>

                {/* Date */}
                <div className="flex flex-column gap-2">
                    <label className="text-xs font-medium text-gray-400">DATE</label>
                    <Calendar
                        value={date}
                        onChange={(e) => onChange('date', e.value)}
                        showIcon
                        dateFormat="yy-mm-dd"
                        className="p-inputtext-sm"
                    />
                </div>

                {/* Industry (Linked to Settings) */}
                <div className="flex flex-column gap-2">
                    <label className="text-xs font-medium text-gray-400">INDUSTRY</label>
                    <Dropdown
                        value={industry}
                        onChange={(e) => onChange('industry', e.value)}
                        options={availableIndustries}
                        optionLabel="label"
                        placeholder="Select Industry"
                        className="p-inputtext-sm"
                        emptyMessage="No industries configured"
                    />
                </div>

                {/* Language (Linked to Settings) */}
                <div className="flex flex-column gap-2">
                    <label className="text-xs font-medium text-gray-400">LANGUAGE</label>
                    <Dropdown
                        value={language}
                        onChange={(e) => onChange('language', e.value)}
                        options={availableLanguages}
                        optionLabel="label"
                        placeholder="Select Language"
                        className="p-inputtext-sm"
                        emptyMessage="No languages configured"
                    />
                </div>
            </div>
        </div>
    );
}