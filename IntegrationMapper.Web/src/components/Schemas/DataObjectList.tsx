import React, { useEffect, useState } from 'react';
import { SchemaApi, type DataObject } from '../../services/api';

interface DataObjectListProps {
    systemId: number;
    refreshTrigger: number;
}

const DataObjectList: React.FC<DataObjectListProps> = ({ systemId, refreshTrigger }) => {
    const [objects, setObjects] = useState<DataObject[]>([]);

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
                        <li key={obj.id} style={{ padding: '5px', borderBottom: '1px solid #eee' }}>
                            <strong>{obj.name}</strong> ({obj.schemaType})
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default DataObjectList;
