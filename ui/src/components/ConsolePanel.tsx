import { useState } from 'react';
import { Button } from 'primereact/button';

export default function ConsolePanel() {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className={`surface-card border-round p-3 shadow-2 flex flex-column transition-all transition-duration-300 ${isCollapsed ? 'h-4rem' : 'h-15rem'}`}>
            <div className="font-bold text-sm mb-2 text-gray-300 flex justify-content-between">
                <span>Console</span>
                <Button
                    icon={`pi ${isCollapsed ? 'pi-chevron-up' : 'pi-chevron-down'}`}
                    text
                    size="small"
                    className="p-0 w-2rem h-2rem"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                />
            </div>

            {!isCollapsed && (
                <div className="flex-grow-1 surface-0 border-round p-2 font-monospace text-sm overflow-y-auto">
                    <div><span style={{ color: '#8888ff' }}>[18:25:01] INFO: </span>Application started.</div>
                    <div><span style={{ color: '#00ff00' }}>[18:25:02] DEBUG: </span>Python backend connected on port 8000.</div>
                    <div><span style={{ color: '#8888ff' }}>[18:28:30] INFO: </span>Added 'Introduction' to playlist.</div>
                    <div><span style={{ color: '#cc2222' }}>[18:29:15] WARN: </span>Image 'Logo.png' resolution low.</div>
                </div>
            )}
        </div>
    );
}