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

export default function ConfigurationPannel(props: ConfigurationPanelProps) {
    const {
        sessionName, selectedCustomer, date, selectedIndustry, selectedLanguage,
        setSessionName, setSelectedCustomer, setDate, setSelectedIndustry, setSelectedLanguage,
    } = props

    // Hardcoded options for now
    const customers = [ { name: 'Acme Corp', code: 'ACME' }, { name: 'Globex', code: 'GLBX' } ];
    const industries = [ { name: 'Technology', code: 'TECH' }, { name: 'Finance', code: 'FIN' } ];
    const languages = [ { name: 'English', code: 'EN' }, { name: 'Dutch', code: 'NL' } ];

    return (
        <div className="flex-1 surface-card border-round p-3 shadow-2 flex flex-column">
            <div className="font-bold text-xl mb-3 border-bottom-1 surface-border pb-2">
                Session Configuration
            </div>
            <div className="flex flex-column gap-3 overflow-y-auto">

                <div className="flex flex-column gap-2">
                    <label htmlFor="sname">Session Name</label>
                    <InputText id="sname" value={sessionName} onChange={(e) => setSessionName(e.target.value)} placeholder="e.g. Q1 Review" />
                </div>

                <div className="flex flex-column gap-2">
                    <label>Customer</label>
                    <Dropdown value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.value)} options={customers} optionLabel="name" placeholder="Select a Customer" className="w-full" />
                </div>

                <div className="flex flex-column gap-2">
                    <label>Date</label>
                    <Calendar value={date} onChange={(e) => setDate(e.value)} showIcon className="w-full" />
                </div>

                <div className="flex flex-column gap-2">
                    <label>Industry</label>
                    <Dropdown value={selectedIndustry} onChange={(e) => setSelectedIndustry(e.value)} options={industries} optionLabel="name" placeholder="Select Industry" className="w-full" />
                </div>

                <div className="flex flex-column gap-2">
                    <label>Language</label>
                    <Dropdown value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.value)} options={languages} optionLabel="name" placeholder="Select Language" className="w-full" />
                </div>
            </div>
        </div>
    );
}