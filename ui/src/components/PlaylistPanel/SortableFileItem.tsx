import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from 'primereact/button';
import type { FileItem } from '../../types/session';
import { getFileIcon } from '../../utils/icons';

interface SortableFileItemProps {
    item: FileItem;
    onDelete: () => void;
    isLocked: boolean;
}

export function SortableFileItem({ item, onDelete, isLocked }: SortableFileItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: item.id, data: { type: 'FILE', item } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="flex align-items-center p-2 surface-card border-1 surface-border border-round hover:surface-hover transition-colors cursor-move mb-2"
        >
            {/* Icon Column */}
            <div className="flex align-items-center justify-content-center w-2rem mr-2">
                {getFileIcon(item.fileType)}
            </div>

            {/* Text Column */}
            <div className="flex flex-column flex-grow-1 overflow-hidden">
                <span className="text-gray-500 text-xs uppercase font-bold" style={{ fontSize: '0.6rem' }}>File</span>
                <span className="font-medium text-sm text-gray-200 white-space-nowrap overflow-hidden text-overflow-ellipsis">
                    {item.name}
                </span>
            </div>

            {/* Actions Column */}
            {!isLocked && (
                <Button
                    icon="pi pi-times"
                    rounded text
                    severity="secondary"
                    className="h-1rem w-1rem text-gray-600 hover:text-red-400"
                    onPointerDown={(e) => e.stopPropagation()} // Important: Prevents drag start when clicking delete
                    onClick={onDelete}
                />
            )}
        </div>
    );
}