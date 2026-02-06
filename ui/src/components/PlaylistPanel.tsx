import { OrderList } from 'primereact/orderlist';
import { Button } from 'primereact/button';

interface PlaylistPanelProps {
    items: any[];
    setItems: (val: any[]) => void;
}

export default function PlaylistPanel(props: PlaylistPanelProps) {
    const {items, setItems} = props;

    const itemTemplate = (item: any) => {
        return (
            <div className="flex align-items-center p-2 w-full flex-wrap">
                <span className="font-bold">{item.name}</span>
            </div>
        );
    };

    return (
        <div className="flex-1 surface-card border-round p-3 shadow-2 flex flex-column">
            <div className="font-bold text-xl mb-3 border-bottom-1 surface-border pb-2 flex justify-content-between align-items-center">
                <span>Session Topics</span>
                <div className="flex gap-1">
                    <Button icon="pi pi-save" rounded text size="small" tooltip="Save Playlist" />
                    <Button icon="pi pi-refresh" rounded text size="small" tooltip="Load Playlist" />
                    <Button icon="pi pi-trash" rounded text severity="danger" size="small" tooltip="Clear" />
                </div>
            </div>
            <div className="flex-grow-1 overflow-y-auto">
                <OrderList
                    dataKey="playlistpanel"
                    value={items}
                    onChange={(e) => setItems(e.value)}
                    itemTemplate={itemTemplate}
                    dragdrop
                    header="Drag to reorder"
                    className="w-full"
                >
                </OrderList>
            </div>
        </div>
    );
}