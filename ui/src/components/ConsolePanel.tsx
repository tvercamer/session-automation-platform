import { useState, useEffect, useRef } from 'react';
import { Button } from 'primereact/button';

interface LogEntry {
    time: string;
    level: string;
    msg: string;
    color: string;
}

export default function ConsolePanel() {
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [logs, setLogs] = useState<LogEntry[]>([
        {
            time: new Date().toLocaleTimeString('en-GB'),
            level: 'SYSTEM',
            msg: 'Console ready.',
            color: '#8888ff'
        }
    ]);

    // Reference for auto-scrolling
    const logContainerRef = useRef<HTMLDivElement>(null);

    // --- 1. SUBSCRIBE TO LOGS ---
    useEffect(() => {
        const handleLog = (data: any) => {
            // Determine color based on level
            let color = '#a0a0a0'; // Default gray
            const lvl = data.level?.toUpperCase() || 'INFO';

            if (lvl === 'INFO') color = '#8888ff';      // Blue-ish
            if (lvl === 'SUCCESS') color = '#4caf50';   // Green
            if (lvl === 'WARN' || lvl === 'WARNING') color = '#ffcc00';      // Yellow
            if (lvl === 'ERROR' || lvl === 'CRITICAL') color = '#ff4444';     // Red
            if (lvl === 'DEBUG') color = '#00ff00';     // Matrix Green

            const newLog = {
                time: data.timestamp || new Date().toLocaleTimeString('en-GB'),
                level: lvl,
                msg: data.message || '',
                color: color
            };

            setLogs(prev => {
                // Keep max 500 logs to prevent memory issues
                const updated = [...prev, newLog];
                if (updated.length > 500) return updated.slice(-500);
                return updated;
            });
        };

        // Connect listener
        // The cleanup function returned by onConsoleLog removes the listener
        const cleanup = window.electronAPI.onConsoleLog(handleLog);

        return () => {
            cleanup();
        };
    }, []);

    // --- 2. AUTO-SCROLL ---
    useEffect(() => {
        if (!isCollapsed && logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs, isCollapsed]);

    const lastLog = logs.length > 0 ? logs[logs.length - 1] : { level: '...', msg: '...', color: '#fff' };

    return (
        <div className={`surface-ground flex flex-column transition-all transition-duration-300 ${isCollapsed ? 'h-3rem' : 'h-15rem'}`}>

            {/* HEADER */}
            <div className="flex align-items-center justify-content-between p-2 px-3 bg-header text-gray-200 h-3rem border-bottom-1 surface-border">
                <div className="flex align-items-center overflow-hidden w-full mr-2">
                    {isCollapsed ? (
                        <div className="flex align-items-center text-sm font-monospace text-gray-400 white-space-nowrap overflow-hidden text-overflow-ellipsis">
                            <span className="font-bold mr-2" style={{ color: lastLog.color }}>[{lastLog.level}]</span>
                            <span>{lastLog.msg}</span>
                        </div>
                    ) : (
                        <span className="font-bold text-sm">Console Output</span>
                    )}
                </div>

                <div className="flex gap-2">
                    {!isCollapsed && (
                        <Button
                            icon="pi pi-trash"
                            text rounded
                            className="h-2rem w-2rem text-gray-400 hover:text-white p-0"
                            tooltip="Clear Console"
                            onClick={() => setLogs([])}
                        />
                    )}
                    <Button
                        icon={`pi ${isCollapsed ? 'pi-chevron-up' : 'pi-chevron-down'}`}
                        text
                        rounded
                        className="h-2rem w-2rem text-gray-400 hover:text-white p-0"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                    />
                </div>
            </div>

            {/* BODY */}
            {!isCollapsed && (
                <div
                    ref={logContainerRef}
                    className="flex-grow-1 p-2 font-monospace text-sm overflow-y-auto custom-scrollbar select-text"
                    style={{ backgroundColor: '#1e1e1e' }} // Slightly darker background for logs
                >
                    {logs.map((log, index) => {
                        return (
                            <div
                                key={index}
                                className="mb-1 p-0 flex align-items-start"
                                style={{ lineHeight: '1.4' }}
                            >
                                <span className="text-gray-600 mr-2 flex-shrink-0" style={{ fontSize: '0.8rem' }}>[{log.time}]</span>
                                <span style={{ color: log.color }} className="font-bold mr-2 flex-shrink-0 w-4rem text-right">{log.level}:</span>
                                <span className="text-gray-300 white-space-pre-wrap word-break-all">{log.msg}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}