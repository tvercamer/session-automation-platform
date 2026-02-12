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

interface Customer {
    name: string;
    code: string;
}

const DEFAULT_LANG: KeyLabel = { code: 'EN', label: 'English' };
const DEFAULT_IND: KeyLabel = { code: 'gen', label: 'Generic' };

export default function ConfigurationPanel({ settings, onChange }: ConfigurationPanelProps) {
    const { sessionName, customer, date, industry, language } = settings;

    // --- STATE ---
    const [availableLanguages, setAvailableLanguages] = useState<KeyLabel[]>([DEFAULT_LANG]);
    const [availableIndustries, setAvailableIndustries] = useState<KeyLabel[]>([DEFAULT_IND]);
    const [availableCustomers, setAvailableCustomers] = useState<Customer[]>([]);
    const [loadingCustomers, setLoadingCustomers] = useState(false);

    // --- LOAD DATA ---
    useEffect(() => {
        let isMounted = true;

        async function loadData() {
            try {
                // 1. SETTINGS (Talen & Industrieën)
                const appSettings = await window.electronAPI.getSettings();
                let langs: KeyLabel[] = appSettings.languages || [];
                let inds: KeyLabel[] = appSettings.industries || [];

                // Defaults enforcen
                if (!langs.find(l => l.code === DEFAULT_LANG.code)) langs.unshift(DEFAULT_LANG);
                if (!inds.find(i => i.code === DEFAULT_IND.code)) inds.unshift(DEFAULT_IND);

                if (isMounted) {
                    setAvailableLanguages(langs);
                    setAvailableIndustries(inds);

                    // Auto-select Defaults als leeg
                    if (!language || !language.code) {
                        const def = langs.find(l => l.code === 'EN') || langs[0];
                        onChange('language', def);
                    }
                    if (!industry || !industry.code) {
                        const def = inds.find(i => i.code === 'gen') || inds[0];
                        onChange('industry', def);
                    }
                }

                // 2. HUBSPOT CUSTOMERS
                if (isMounted) setLoadingCustomers(true);
                // Let op: zorg dat getHubspotCompanies bestaat in je electronAPI (zie eerdere stap)
                // Als die nog niet bestaat, zal dit falen, dus we wrappen in try/catch blok specifiek
                let companies: Customer[] = [];
                try {
                    companies = await window.electronAPI.getHubspotCompanies();
                } catch (err) {
                    console.warn("HubSpot API call failed or not implemented yet", err);
                }

                if (isMounted) {
                    if (companies && companies.length > 0) {
                        setAvailableCustomers(companies);
                    } else {
                        // Fallback data
                        setAvailableCustomers([
                            { name: 'Acme Corp (Local)', code: 'ACME' },
                            { name: 'Globex (Local)', code: 'GLBX' }
                        ]);
                    }
                    setLoadingCustomers(false);
                }

            } catch (e) {
                console.error("Failed to load configuration data", e);
                if (isMounted) setLoadingCustomers(false);
            }
        }
        loadData();

        return () => { isMounted = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- RENDER HELPERS ---
    // Dit zoekt het juiste object in de lijst op basis van de code.
    // Dit fixt het probleem dat dropdowns leeg lijken.
    const selectedLanguage = availableLanguages.find(l => l.code === language?.code) || language;
    const selectedIndustry = availableIndustries.find(i => i.code === industry?.code) || industry;

    return (
        <div className="flex-1 surface-ground flex flex-column h-full surface-border">
            <div className="flex align-items-center p-2 px-3 bg-header" style={{ height: '3rem' }}>
                <span className="font-bold text-sm text-gray-200">Session Configuration</span>
            </div>

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

                {/* Customer (HubSpot) */}
                <div className="flex flex-column gap-2">
                    <label className="text-xs font-medium text-gray-400">CUSTOMER</label>
                    <Dropdown
                        value={customer}
                        onChange={(e) => onChange('customer', e.value)}
                        options={availableCustomers}
                        optionLabel="name"
                        filter // Voegt zoekbalk toe
                        placeholder={loadingCustomers ? "Loading Companies..." : "Select a Customer"}
                        disabled={loadingCustomers}
                        className="p-inputtext-sm"
                        emptyMessage="No companies found"
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

                {/* Industry */}
                <div className="flex flex-column gap-2">
                    <label className="text-xs font-medium text-gray-400">INDUSTRY</label>
                    <Dropdown
                        value={selectedIndustry}
                        onChange={(e) => onChange('industry', e.value)}
                        options={availableIndustries}
                        optionLabel="label"
                        dataKey="code"
                        placeholder="Select Industry"
                        className="p-inputtext-sm"
                        emptyMessage="No industries configured"
                    />
                </div>

                {/* Language */}
                <div className="flex flex-column gap-2">
                    <label className="text-xs font-medium text-gray-400">LANGUAGE</label>
                    <Dropdown
                        value={selectedLanguage}
                        onChange={(e) => onChange('language', e.value)}
                        options={availableLanguages}
                        optionLabel="label"
                        dataKey="code"
                        placeholder="Select Language"
                        className="p-inputtext-sm"
                        emptyMessage="No languages configured"
                    />
                </div>
            </div>
        </div>
    );
}