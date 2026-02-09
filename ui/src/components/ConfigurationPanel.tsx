import type {SessionSettings} from "../types/session.ts";
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';

interface ConfigurationPanelProps {
    settings: SessionSettings;
    onChange: (field: keyof SessionSettings, value: any) => void;
}

export default function ConfigurationPanel({settings, onChange}: ConfigurationPanelProps) {
    const { sessionName, customer, date, industry, language } = settings;

    const customers = [{ name: 'Acme Corp', code: 'ACME' }, { name: 'Globex', code: 'GLBX' }];
    const industries = [{ name: 'Generic', code: 'GEN' }, { name: 'Technology', code: 'TECH' }, { name: 'Finance', code: 'FIN' }];
    const languages = [{ name: 'English', code: 'EN' }, { name: 'Dutch', code: 'NL' }];

    return (
        <div className="flex-1 surface-ground flex flex-column h-full surface-border">
            <div className="flex align-items-center p-2 px-3 bg-header" style={{ height: '3rem' }}>
                <span className="font-bold text-sm text-gray-200">Session Configuration</span>
            </div>

            <div className="flex flex-column gap-4 p-3 overflow-y-auto">
                <div className="flex flex-column gap-2">
                    <label htmlFor="sname" className="text-xs font-medium text-gray-400">SESSION NAME</label>
                    <InputText
                        id="sname"
                        value={sessionName}
                        onChange={(e) => onChange('sessionName', e.target.value)}
                        placeholder="e.g. Q1 Review"
                    />
                </div>

                <div className="flex flex-column gap-2">
                    <label className="text-xs font-medium text-gray-400">CUSTOMER</label>
                    <Dropdown
                        value={customer}
                        onChange={(e) => onChange('customer', e.value)}
                        options={customers}
                        optionLabel="name"
                        placeholder="Select a Customer"
                    />
                </div>

                <div className="flex flex-column gap-2">
                    <label className="text-xs font-medium text-gray-400">DATE</label>
                    <Calendar
                        value={date}
                        onChange={(e) => onChange('date', e.value)}
                        showIcon
                        dateFormat="yy-mm-dd"
                    />
                </div>

                <div className="flex flex-column gap-2">
                    <label className="text-xs font-medium text-gray-400">INDUSTRY</label>
                    <Dropdown
                        value={industry}
                        onChange={(e) => onChange('industry', e.value)}
                        options={industries}
                        optionLabel="name"
                        placeholder="Select Industry"
                    />
                </div>

                <div className="flex flex-column gap-2">
                    <label className="text-xs font-medium text-gray-400">LANGUAGE</label>
                    <Dropdown
                        value={language}
                        onChange={(e) => onChange('language', e.value)}
                        options={languages}
                        optionLabel="name"
                        placeholder="Select Language"
                    />
                </div>
            </div>
        </div>
    );
}