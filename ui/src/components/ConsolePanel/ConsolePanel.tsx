import { useState, useEffect, useRef } from 'react';
import { Button } from 'primereact/button';
import LogItem from "./LogItem.tsx";

export interface LogEntry {
    time: string;
    level: string;
    message: string;
    color: string;
}

const getLogColor = (level?: string): string => {
    const lvl = level?.toUpperCase() || 'INFO';
    switch (lvl) {
        case 'INFO': return '#60a5fa';      // Blue-400
        case 'SUCCESS': return '#4ade80';   // Green-400
        case 'WARN':
        case 'WARNING': return '#facc15';   // Yellow-400
        case 'ERROR':
        case 'CRITICAL': return '#f87171';  // Red-400
        case 'DEBUG': return '#4ade80';     // Green-400
        case 'SYSTEM': return '#c084fc';    // Purple-400
        default: return '#9ca3af';          // Gray-400
    }
};

const MAX_LOGS = 500;

export default function ConsolePanel() {
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [logs, setLogs] = useState<LogEntry[]>([
        {
            time: new Date().toLocaleTimeString('en-GB'),
            level: 'SYSTEM',
            message: 'Console ready.',
            color: getLogColor('SYSTEM')
        }
    ]);

    const logContainerRef = useRef<HTMLDivElement>(null);

    // --- 1. SUBSCRIBE TO LOGS ---
    useEffect(() => {
        const handleLog = (data: any) => {
            const level = data.level?.toUpperCase() || 'INFO';

            // Filter out Uvicorn access logs
            if (data.message && data.message.includes("GET /") && level === 'INFO') {
                return;
            }

            const newLog: LogEntry = {
                time: data.timestamp || new Date().toLocaleTimeString('en-GB'),
                level: level,
                message: data.message || data.msg || '',
                color: getLogColor(level)
            };

            setLogs(prev => {
                const updated = [...prev, newLog];
                if (updated.length > MAX_LOGS) return updated.slice(-MAX_LOGS);
                return updated;
            });
        };

        const removeListener = window.electronAPI.onConsoleLog(handleLog);
        return () => { if (removeListener) removeListener(); };
    }, []);

    // --- 2. AUTO-SCROLL ---
    useEffect(() => {
        if (!isCollapsed && logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs, isCollapsed]);

    const lastLog = logs.length > 0 ? logs[logs.length - 1] : { level: '...', message: '...', color: '#9ca3af', time: '' };

    return (
        <div className={`flex flex-column transition-all transition-duration-300 surface-ground ${isCollapsed ? 'h-3rem' : 'h-15rem'}`}>

            {/* HEADER */}
            <div
                className="flex align-items-center justify-content-between p-2 px-3 bg-header cursor-pointer"
                style={{ height: '3rem' }}
                onClick={() => setIsCollapsed(!isCollapsed)}
            >
                <div className="flex align-items-center overflow-hidden w-full mr-2">
                    {isCollapsed ? (
                        // COLLAPSED: [LEVEL]Message (No gap)
                        <div className="flex align-items-center text-sm font-monospace white-space-nowrap overflow-hidden text-overflow-ellipsis w-full">
                            <span
                                className="font-bold text-xs"
                                style={{ color: lastLog.color }}
                            >
                                {lastLog.level}
                            </span>
                            <span className="text-gray-400 text-overflow-ellipsis overflow-hidden ml-1">
                                {lastLog.message}
                            </span>
                        </div>
                    ) : (
                        // EXPANDED TITLE
                        <div className="flex align-items-center gap-2 text-gray-200">
                            <i className="pi pi-terminal"></i>
                            <span className="font-bold text-sm">System Console</span>
                        </div>
                    )}
                </div>

                {/* CONTROLS */}
                <div className="flex gap-1 align-items-center">
                    {!isCollapsed && (
                        <Button
                            icon="pi pi-trash"
                            text rounded
                            className="h-2rem w-2rem text-gray-400 hover:text-white"
                            tooltip="Clear Console"
                            onClick={(e) => {
                                e.stopPropagation();
                                setLogs([]);
                            }}
                        />
                    )}
                    {/* Using Button for Chevron to ensure perfect alignment with Trash bin */}
                    <Button
                        icon={`pi ${isCollapsed ? 'pi-chevron-down' : 'pi-chevron-up'}`}
                        text rounded
                        className="h-2rem w-2rem text-gray-400 hover:text-white"
                    />
                </div>
            </div>

            {/* BODY */}
            {!isCollapsed && (
                <div
                    ref={logContainerRef}
                    className="flex-grow-1 p-2 font-monospace text-sm overflow-y-auto custom-scrollbar select-text surface-ground"
                >
                    {logs.map((log, index) => (
                        <LogItem key={index} log={log} />
                    ))}
                </div>
            )}
        </div>
    );
}