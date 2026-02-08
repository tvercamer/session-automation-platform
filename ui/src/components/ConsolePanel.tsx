import { useState } from 'react';
import { Button } from 'primereact/button';

export default function ConsolePanel() {
    const [isCollapsed, setIsCollapsed] = useState(true);

    // Hardcoded logs
    const logs = [
        { time: '18:25:01', level: 'INFO', msg: 'Application started.', color: '#8888ff' },
        { time: '18:25:02', level: 'DEBUG', msg: 'Python backend connected on port 8000.', color: '#00ff00' },
        { time: '18:28:30', level: 'INFO', msg: "Added 'Introduction' to playlist.", color: '#8888ff' },
        { time: '18:29:15', level: 'WARN', msg: "Image 'Logo.png' resolution low.", color: '#cc2222' },
        { time: '18:30:05', level: 'SUCCESS', msg: "Session playlist saved successfully.", color: '#4caf50' } // Last line
    ];

    const lastLog = logs[logs.length - 1];

    return (
        <div className={`surface-ground flex flex-column transition-all transition-duration-300 ${isCollapsed ? 'h-3rem' : 'h-15rem'}`}>

            <div className="flex align-items-center justify-content-between p-2 px-3 bg-header text-gray-200 h-3rem">
                <div className="flex align-items-center overflow-hidden w-full mr-2">
                    {isCollapsed ? (
                        <div className="flex align-items-center text-sm font-monospace text-gray-400 white-space-nowrap overflow-hidden text-overflow-ellipsis">
                            <span className="font-bold mr-2" style={{ color: lastLog.color }}>[{lastLog.level}]</span>
                            <span>{lastLog.msg}</span>
                        </div>
                    ) : (
                        <span className="font-bold text-sm">Console</span>
                    )}
                </div>

                <Button
                    icon={`pi ${isCollapsed ? 'pi-chevron-up' : 'pi-chevron-down'}`}
                    text
                    rounded
                    className="h-2rem w-2rem text-gray-400 hover:text-white p-0"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                />
            </div>

            {!isCollapsed && (
                <div className="flex-grow-1 surface-ground p-2 font-monospace text-sm overflow-y-auto custom-scrollbar" style={{ backgroundColor: '#09090b' }}>
                    {logs.map((log, index) => {
                        const isLast = index === logs.length - 1;
                        return (
                            <div
                                key={index}
                                className={`mb-1 p-1 border-round ${isLast ? 'surface-card' : ''}`} // Highlight last line
                                style={isLast ? { borderLeft: '3px solid ' + log.color } : {}}
                            >
                                <span className="text-gray-500 mr-2">[{log.time}]</span>
                                <span style={{ color: log.color }} className="font-bold mr-2">{log.level}:</span>
                                <span className="text-gray-300">{log.msg}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}