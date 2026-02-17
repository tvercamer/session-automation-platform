import type {LogEntry} from './ConsolePanel';

interface ILogItemProps {
    log: LogEntry;
}

export default function LogItem({log}: ILogItemProps) {
    return (
        <div
            className="mb-1 flex align-items-center border-round-xs px-2 py-0"
            style={{lineHeight: '1.4'}}
        >
            {/* TIME (Fixed width, margin right) */}
            <span className="text-gray-500 text-xs select-none w-5rem flex-shrink-0">
                {log.time}
            </span>

            {/* LEVEL (Fixed width, margin right) */}
            <span
                className="font-bold text-xs select-none w-5rem flex-shrink-0"
                style={{color: log.color}}
            >
                {log.level}
            </span>

            {/* MESSAGE */}
            <span className="text-gray-300 white-space-pre-wrap word-break-all flex-1">
                {log.message}
            </span>
        </div>
    );
}