import React, { useEffect, useState } from 'react';
import { SchemaApi, type DataObject } from '../../services/api';
import SchemaViewerModal from '../Systems/SchemaViewerModal';

interface DataObjectListProps {
    systemId: number;
    refreshTrigger: number;
}

const DataObjectList: React.FC<DataObjectListProps> = ({ systemId, refreshTrigger }) => {
    const [objects, setObjects] = useState<DataObject[]>([]);
    const [viewSchema, setViewSchema] = useState<{ id: number, name: string } | null>(null);

    useEffect(() => {
        loadObjects();
    }, [systemId, refreshTrigger]);

    const loadObjects = async () => {
        try {
            const data = await SchemaApi.getDataObjects(systemId);
            setObjects(data);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div style={{ marginTop: '20px' }}>
            <h4>Data Objects</h4>
            {objects.length === 0 ? (
                <p>No data objects found.</p>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {objects.map(obj => (
                        <li key={obj.id} style={{ padding: '5px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span><strong>{obj.name}</strong> ({obj.schemaType})</span>
                            <div>
                                <button onClick={() => setViewSchema({ id: obj.id, name: obj.name })} style={{ marginRight: '5px' }}>View</button>
                                <button onClick={() => SchemaApi.downloadSchema(obj.id, obj.name + (obj.schemaType === 'XSD' ? '.xsd' : '.json'))}>Download</button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {viewSchema && (
                <SchemaViewerModal
                    isOpen={!!viewSchema}
                    onClose={() => setViewSchema(null)}
                    schemaId={viewSchema.id}
                    schemaName={viewSchema.name}
                />
            )}
        </div>
    );
};

export default DataObjectList;
