import { useState, useEffect } from 'react';
import type { SessionSettings } from "../types/session.ts";
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';

interface ConfigurationPanelProps {
    settings: SessionSettings;
    onChange: (field: keyof SessionSettings, value: any) => void;
}

// Interfaces must match session.ts
interface KeyLabel {
    code: string;
    label: string;
    matches?: string[];
}

interface Customer {
    name: string;
    code: string;
    industry?: string;
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
                // 1. SETTINGS
                const appSettings = await window.electronAPI.getSettings();
                let langs: KeyLabel[] = appSettings.languages || [];
                let inds: KeyLabel[] = appSettings.industries || [];

                if (!langs.find(l => l.code === DEFAULT_LANG.code)) langs.unshift(DEFAULT_LANG);
                if (!inds.find(i => i.code === DEFAULT_IND.code)) inds.unshift(DEFAULT_IND);

                if (isMounted) {
                    setAvailableLanguages(langs);
                    setAvailableIndustries(inds);

                    // Auto-select Defaults if empty
                    if (!language || !language.code) {
                        onChange('language', langs.find(l => l.code === 'EN') || langs[0]);
                    }
                    if (!industry || !industry.code) {
                        onChange('industry', inds.find(i => i.code === 'gen') || inds[0]);
                    }
                }

                // 2. HUBSPOT CUSTOMERS
                if (isMounted) setLoadingCustomers(true);
                let companies: Customer[] = [];
                try {
                    companies = await window.electronAPI.getHubspotCompanies();
                } catch (err) {
                    console.warn("HubSpot API call failed", err);
                }

                if (isMounted) {
                    if (companies && companies.length > 0) {
                        setAvailableCustomers(companies);
                    } else {
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

    // --- AUTO-MAPPING LOGIC ---
    const handleCustomerChange = (newCustomer: Customer | null) => {
        // 1. Always update the customer selection first
        onChange('customer', newCustomer);

        // 2. Determine the HubSpot industry (if any)
        const hubspotIndustry = newCustomer?.industry;

        console.log(`Attempting to map HubSpot industry: "${hubspotIndustry}"`);

        // 3. Find a match in our internal industry list
        let matchedIndustry = null;

        if (hubspotIndustry) {
            matchedIndustry = availableIndustries.find(ind =>
                ind.matches && ind.matches.includes(hubspotIndustry)
            );
        }

        // 4. Apply Logic: Match OR Fallback
        if (matchedIndustry) {
            console.log(`Found match! Setting industry to: ${matchedIndustry.label}`);
            onChange('industry', matchedIndustry);
        } else {
            console.log("No mapping found. Reverting to Default (Generic).");
            // Find the default 'gen' industry in our available list
            const defaultInd = availableIndustries.find(i => i.code === 'gen') || availableIndustries[0];
            if (defaultInd) {
                onChange('industry', defaultInd);
            }
        }
    };


    // --- RENDER HELPERS ---
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
                        // --- THE FIX IS HERE ---
                        // We now call our custom handler instead of passing data directly to onChange
                        onChange={(e) => handleCustomerChange(e.value)}
                        // -----------------------
                        options={availableCustomers}
                        optionLabel="name"
                        filter
                        placeholder={loadingCustomers ? "Loading Companies..." : "Select a Customer"}
                        disabled={loadingCustomers}
                        className="p-inputtext-sm"
                        emptyMessage="No companies found"
                        itemTemplate={(option) => (
                            <div className="flex flex-column">
                                <span>{option.name}</span>
                                {option.industry && <span className="text-xs text-gray-400">{option.industry}</span>}
                            </div>
                        )}
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