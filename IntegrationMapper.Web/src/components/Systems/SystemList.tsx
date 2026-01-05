import React, { useEffect, useState } from 'react';
import { SystemApi, type IntegrationSystem } from '../../services/api';

interface SystemListProps {
    onAddClick: () => void;
}

import { commonStyles } from '../../styles/common';

import { useNavigate } from 'react-router-dom';

const SystemList: React.FC<SystemListProps> = ({ onAddClick }) => {
    // ... (state vars remain same)
    const navigate = useNavigate();
    const [systems, setSystems] = useState<IntegrationSystem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

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

    const filteredSystems = systems.filter(s => {
        const term = searchTerm.toLowerCase();
        return s.name.toLowerCase().includes(term) ||
            s.category?.toLowerCase().includes(term) ||
            s.description?.toLowerCase().includes(term);
    });

    if (loading) return <div>Loading systems...</div>;
    if (error) return <div style={{ color: 'red' }}>{error}</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Standard Header */}
            <div style={commonStyles.header}>
                <h2 style={commonStyles.headerTitle}>Integration Systems</h2>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                        type="text"
                        placeholder="Filter systems..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', width: '250px' }}
                    />
                    <button onClick={onAddClick} style={commonStyles.primaryButton}>+ Add System</button>
                </div>
            </div>

            <div style={{ ...commonStyles.container, flex: 1, overflowY: 'auto' }}>

                {filteredSystems.length === 0 ? (
                    <p>No systems found matching your criteria.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {filteredSystems.map((system) => (
                            <div key={system.id} style={commonStyles.listItem}>
                                <div>
                                    <strong style={{ fontSize: '18px', color: '#2c3e50', display: 'block' }}>{system.name}</strong>
                                    <div style={{ fontSize: '14px', color: '#7f8c8d', marginTop: '5px' }}>
                                        <span style={{ marginRight: '15px' }}>Category: <strong>{system.category}</strong></span>
                                    </div>
                                    <div style={{ marginTop: '8px', fontSize: '14px', color: '#555' }}>
                                        {system.description}
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate(`/systems/${system.id}`)}
                                    style={{ ...commonStyles.primaryButton, backgroundColor: 'white', color: '#007bff', border: '1px solid #007bff' }}
                                >
                                    View Details
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SystemList;
