import React, { useState } from 'react';
import { type IntegrationSystem } from '../../services/api';
import SchemaUpload from '../Schemas/SchemaUpload';
import DataObjectList from '../Schemas/DataObjectList';

interface SystemDetailProps {
    system: IntegrationSystem;
    onBack: () => void;
}

const SystemDetail: React.FC<SystemDetailProps> = ({ system, onBack }) => {
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    return (
        <div style={{ padding: '20px' }}>
            <button onClick={onBack} style={{ marginBottom: '10px' }}>&larr; Back to Systems</button>
            <h2>{system.name}</h2>
            <p>{system.description}</p>
            <p><strong>Category:</strong> {system.category} | <strong>External ID:</strong> {system.externalId}</p>

            <hr />

            <h3>Data Objects & Schemas</h3>
            <SchemaUpload systemId={system.id} onUploadSuccess={() => setRefreshTrigger(prev => prev + 1)} />
            <DataObjectList systemId={system.id} refreshTrigger={refreshTrigger} />
        </div>
    );
};

export default SystemDetail;
