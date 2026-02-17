import { useEffect } from 'react';
import { InputText } from 'primereact/inputtext';
import { Dropdown, type DropdownChangeEvent } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';

import { useConfigurationData } from '../hooks/useConfigurationData';
import type { SessionSettings, Customer } from "../types/session";

interface ConfigurationPanelProps {
    settings: SessionSettings;
    onChange: (field: keyof SessionSettings, value: any) => void;
    refreshTrigger: number;
}

export default function ConfigurationPanel({ settings, onChange, refreshTrigger }: ConfigurationPanelProps) {
    const { sessionName, customer, date, industry, language } = settings;
    const { languages, industries, customers, loading } = useConfigurationData(refreshTrigger);

    // --- 1. HANDLING DEFAULTS ---
    // Runs when data loads. If no selection exists, pick the one marked 'isDefault' or the first one.
    useEffect(() => {
        if (loading) return;

        if (!language && languages.length > 0) {
            const defaultLang = languages.find(l => l.isDefault) || languages[0];
            onChange('language', defaultLang);
        }

        if (!industry && industries.length > 0) {
            const defaultInd = industries.find(i => i.isDefault) || industries[0];
            onChange('industry', defaultInd);
        }
    }, [loading, languages, industries, language, industry]); // removed onChange to prevent loop

    // --- 2. MAPPING LOGIC ---
    const findIndustryMatch = (hubspotValue?: string) => {
        if (!hubspotValue) return null;
        return industries.find(ind => ind.matches?.includes(hubspotValue));
    };

    const handleCustomerChange = (newCustomer: Customer | null) => {
        onChange('customer', newCustomer);

        if (newCustomer?.industry) {
            const match = findIndustryMatch(newCustomer.industry);

            if (match) {
                // If we found a mapped internal industry, select it
                onChange('industry', match);
            } else {
                // Fallback: If HubSpot has an industry we don't know,
                // revert to the default internal industry (usually 'Generic')
                const def = industries.find(i => i.isDefault) || industries[0];
                if (def) onChange('industry', def);
            }
        }
    };

    // --- TEMPLATES ---
    const customerTemplate = (option: Customer) => {
        if (!option) return <span>Select a Customer</span>;
        const mappedIndustry = findIndustryMatch(option.industry);
        const displayLabel = mappedIndustry ? mappedIndustry.label : option.industry;

        return (
            <div className="flex flex-column">
                <span className="font-medium">{option.name}</span>
                {option.industry && (
                    <div className="flex align-items-center gap-2 text-xs text-gray-500">
                        <span>{displayLabel}</span>
                        {mappedIndustry && (
                            <i className="pi pi-link text-blue-400" style={{ fontSize: '0.7rem' }} title="Mapped to internal industry"></i>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex-1 surface-ground flex flex-column h-full">
            {/* HEADER */}
            <div className="flex align-items-center p-2 px-3 bg-header" style={{ height: '3rem' }}>
                <span className="font-bold text-sm text-gray-200">Session Configuration</span>
            </div>

            <div className="flex flex-column gap-4 p-3 overflow-y-auto">

                {/* Session Name */}
                <div className="flex flex-column gap-2">
                    <label htmlFor="sname" className="text-xs font-bold text-gray-400">SESSION NAME</label>
                    <InputText
                        id="sname"
                        value={sessionName}
                        onChange={(e) => onChange('sessionName', e.target.value)}
                        placeholder="e.g. Q1 Review"
                        className="p-inputtext-sm w-full"
                    />
                </div>

                {/* Customer (HubSpot) */}
                <div className="flex flex-column gap-2">
                    <label className="text-xs font-bold text-gray-400">CUSTOMER</label>
                    <Dropdown
                        value={customer}
                        onChange={(e: DropdownChangeEvent) => handleCustomerChange(e.value)}
                        options={customers}
                        optionLabel="name"
                        filter
                        placeholder={loading ? "Loading..." : "Select a Customer"}
                        disabled={loading}
                        className="p-inputtext-sm w-full"
                        emptyMessage="No customers found"
                        itemTemplate={customerTemplate}
                        valueTemplate={customerTemplate}
                    />
                </div>

                {/* Date */}
                <div className="flex flex-column gap-2">
                    <label className="text-xs font-bold text-gray-400">DATE</label>
                    <Calendar
                        value={date}
                        onChange={(e) => onChange('date', e.value)}
                        showIcon
                        dateFormat="yy-mm-dd"
                        className="p-inputtext-sm w-full"
                    />
                </div>

                {/* Industry */}
                <div className="flex flex-column gap-2">
                    <label className="text-xs font-bold text-gray-400">INDUSTRY</label>
                    <Dropdown
                        value={industry}
                        onChange={(e: DropdownChangeEvent) => onChange('industry', e.value)}
                        options={industries}
                        optionLabel="label"
                        dataKey="code"
                        placeholder="Select Industry"
                        className="p-inputtext-sm w-full"
                        emptyMessage="No industries configured"
                    />
                </div>

                {/* Language */}
                <div className="flex flex-column gap-2">
                    <label className="text-xs font-bold text-gray-400">LANGUAGE</label>
                    <Dropdown
                        value={language}
                        onChange={(e: DropdownChangeEvent) => onChange('language', e.value)}
                        options={languages}
                        optionLabel="label"
                        dataKey="code"
                        placeholder="Select Language"
                        className="p-inputtext-sm w-full"
                        emptyMessage="No languages configured"
                    />
                </div>
            </div>
        </div>
    );
}