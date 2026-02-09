import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from 'primereact/button';
import type { FileItem } from '../../types/session';

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

    // Helper to get icon based on type (simple version)
    const getIcon = (type: string) => {
        if (type.includes('pptx')) return 'pi-file text-orange-500';
        if (type.includes('docx')) return 'pi-file text-blue-500';
        if (type.includes('xlsx')) return 'pi-file-excel text-green-500';
        return 'pi-file text-gray-500';
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="flex align-items-center p-2 surface-card border-1 surface-border border-round mb-2 hover:surface-hover cursor-move transition-colors"
        >
            <i className={`pi ${getIcon(item.fileType)} mr-2 text-lg`}></i>

            <div className="flex flex-column flex-grow-1 overflow-hidden">
                <span className="text-gray-200 text-sm white-space-nowrap overflow-hidden text-overflow-ellipsis">
                    {item.name}
                </span>
            </div>

            {!isLocked && (
                <Button
                    icon="pi pi-times"
                    rounded text
                    className="w-2rem h-2rem text-gray-500 hover:text-red-500"
                    onPointerDown={(e) => e.stopPropagation()} // Prevent drag start on delete
                    onClick={onDelete}
                />
            )}
        </div>
    );
}