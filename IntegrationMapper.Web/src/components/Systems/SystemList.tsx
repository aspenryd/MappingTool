import React, { useEffect, useState } from 'react';
import { SystemApi, type IntegrationSystem } from '../../services/api';

interface SystemListProps {
    onAddClick: () => void;
    onSelectSystem: (system: IntegrationSystem) => void;
}

const SystemList: React.FC<SystemListProps> = ({ onAddClick, onSelectSystem }) => {
    const [systems, setSystems] = useState<IntegrationSystem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadSystems();
    }, []);

    const loadSystems = async () => {
        try {
            setLoading(true);
            const data = await SystemApi.getSystems();
            setSystems(data);
        } catch (err) {
            setError('Failed to load systems');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading systems...</div>;
    if (error) return <div style={{ color: 'red' }}>{error}</div>;

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Integration Systems</h2>
                <button onClick={onAddClick} style={{ padding: '10px 20px', cursor: 'pointer' }}>Add System</button>
            </div>

            {systems.length === 0 ? (
                <p>No systems found. Create one to get started.</p>
            ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                            <th style={{ padding: '10px' }}>Name</th>
                            <th style={{ padding: '10px' }}>Category</th>
                            <th style={{ padding: '10px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {systems.map((system) => (
                            <tr key={system.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '10px' }}>{system.name}</td>
                                <td style={{ padding: '10px' }}>{system.category}</td>
                                <td style={{ padding: '10px' }}>
                                    <button onClick={() => onSelectSystem(system)} style={{ marginRight: '10px' }}>View Details & Schemas</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default SystemList;
