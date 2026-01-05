import React, { useState } from 'react';
import { type IntegrationSystem } from '../../services/api';
import SchemaUpload from '../Schemas/SchemaUpload';
import DataObjectList from '../Schemas/DataObjectList';

interface SystemDetailProps {
    systemId: string;
    onBack: () => void;
}

import { commonStyles } from '../../styles/common';
import { SystemApi } from '../../services/api';

const SystemDetail: React.FC<SystemDetailProps> = ({ systemId, onBack }) => {
    const [system, setSystem] = useState<IntegrationSystem | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    React.useEffect(() => {
        loadSystem();
    }, [systemId]);

    const loadSystem = async () => {
        try {
            setLoading(true);
            const data = await SystemApi.getSystem(systemId);
            setSystem(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading System...</div>;
    if (!system) return <div>System not found</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Standard Header */}
            <div style={commonStyles.header}>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <button onClick={onBack} style={commonStyles.backButton} title="Back to Systems">
                        ←
                    </button>
                    <div>
                        <h2 style={commonStyles.headerTitle}>{system.name}</h2>
                        <div style={{ fontSize: '12px', color: '#777' }}>{system.category}</div>
                    </div>
                </div>
                <div style={{ fontSize: '14px', color: '#555' }}>External ID: <strong>{system.externalId}</strong></div>
            </div>

            <div style={{ ...commonStyles.container, flex: 1, overflowY: 'auto' }}>
                <p style={{ marginBottom: '20px', color: '#555' }}>{system.description}</p>

                <div style={commonStyles.card}>
                    <h3>Data Objects & Schemas</h3>
                    <div style={{ marginTop: '15px' }}>
                        <SchemaUpload systemId={system.id} onUploadSuccess={() => setRefreshTrigger(prev => prev + 1)} />
                    </div>
                    <div style={{ marginTop: '20px' }}>
                        <DataObjectList systemId={system.id} refreshTrigger={refreshTrigger} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemDetail;
