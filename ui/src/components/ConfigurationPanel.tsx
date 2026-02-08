import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';

interface ConfigurationPanelProps {
    sessionName: string;
    setSessionName: (val: string) => void;
    selectedCustomer: any;
    setSelectedCustomer: (val: any) => void;
    date: Date | null | undefined;
    setDate: (val: Date | null | undefined) => void;
    selectedIndustry: any;
    setSelectedIndustry: (val: any) => void;
    selectedLanguage: any;
    setSelectedLanguage: (val: any) => void;
}

export default function ConfigurationPanel(props: ConfigurationPanelProps) {
    const {
        sessionName, selectedCustomer, date, selectedIndustry, selectedLanguage,
        setSessionName, setSelectedCustomer, setDate, setSelectedIndustry, setSelectedLanguage,
    } = props

    const customers = [{ name: 'Acme Corp', code: 'ACME' }, { name: 'Globex', code: 'GLBX' }];
    const industries = [{ name: 'Technology', code: 'TECH' }, { name: 'Finance', code: 'FIN' }];
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
                        onChange={(e) => setSessionName(e.target.value)}
                        placeholder="e.g. Q1 Review"
                    />
                </div>

                <div className="flex flex-column gap-2">
                    <label className="text-xs font-medium text-gray-400">CUSTOMER</label>
                    <Dropdown
                        value={selectedCustomer}
                        onChange={(e) => setSelectedCustomer(e.value)}
                        options={customers}
                        optionLabel="name"
                        placeholder="Select a Customer"
                    />
                </div>

                <div className="flex flex-column gap-2">
                    <label className="text-xs font-medium text-gray-400">DATE</label>
                    <Calendar
                        value={date}
                        onChange={(e) => setDate(e.value)}
                        showIcon
                        dateFormat="yy-mm-dd"
                    />
                </div>

                <div className="flex flex-column gap-2">
                    <label className="text-xs font-medium text-gray-400">INDUSTRY</label>
                    <Dropdown
                        value={selectedIndustry}
                        onChange={(e) => setSelectedIndustry(e.value)}
                        options={industries}
                        optionLabel="name"
                        placeholder="Select Industry"
                    />
                </div>

                <div className="flex flex-column gap-2">
                    <label className="text-xs font-medium text-gray-400">LANGUAGE</label>
                    <Dropdown
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.value)}
                        options={languages}
                        optionLabel="name"
                        placeholder="Select Language"
                    />
                </div>
            </div>
        </div>
    );
}