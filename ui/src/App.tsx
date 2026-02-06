import { Button } from 'primereact/button';

export default function App() {
    return (
        <div className="surface-ground h-screen flex align-items-center justify-content-center">
            <div className="surface-card p-5 shadow-2 border-round">
                <h1 className="text-white">Theme Test</h1>
                <Button label="PrimeReact is Working" icon="pi pi-check" />
            </div>
        </div>
    )
}