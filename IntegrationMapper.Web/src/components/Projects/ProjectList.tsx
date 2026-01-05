import React, { useEffect, useState } from 'react';
import { ProjectApi, SystemApi, type MappingProject } from '../../services/api';

import { useNavigate } from 'react-router-dom';

interface ProjectListProps {
    onAddClick: () => void;
}

import { commonStyles } from '../../styles/common';

const ProjectList: React.FC<ProjectListProps> = ({ onAddClick }) => {
    const [projects, setProjects] = useState<MappingProject[]>([]);
    const [systems, setSystems] = useState<Record<string, string>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        loadProjectsAndSystems();
    }, []);

    const loadProjectsAndSystems = async () => {
        try {
            const [projectsData, systemsData] = await Promise.all([
                ProjectApi.getAllProjects(),
                SystemApi.getSystems()
            ]);
            setProjects(projectsData);

            const sysMap: Record<string, string> = {};
            systemsData.forEach(s => sysMap[s.id] = s.name);
            setSystems(sysMap);
        } catch (err) {
            console.error(err);
        }
    };

    const filteredProjects = projects.filter(p => {
        const term = searchTerm.toLowerCase();
        const sourceName = systems[p.sourceSystemId] || '';
        const targetName = systems[p.targetSystemId] || '';
        return p.name.toLowerCase().includes(term) ||
            sourceName.toLowerCase().includes(term) ||
            targetName.toLowerCase().includes(term);
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Standard Header */}
            <div style={commonStyles.header}>
                <h2 style={commonStyles.headerTitle}>Mapping Projects</h2>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <input
                        type="text"
                        placeholder="Search projects or systems..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd', width: '300px' }}
                    />
                    <button
                        onClick={onAddClick}
                        style={commonStyles.primaryButton}
                    >
                        + Create New Project
                    </button>
                </div>
            </div>

            <div style={{ ...commonStyles.container, flex: 1, overflowY: 'auto' }}>

                {filteredProjects.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#666', background: '#f9f9f9', borderRadius: '8px' }}>
                        No projects found matching your search.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {filteredProjects.map(p => (
                            <div key={p.id} style={commonStyles.listItem}>
                                <div>
                                    <strong style={{ fontSize: '18px', color: '#2c3e50' }}>{p.name}</strong>
                                    <div style={{ marginTop: '5px', color: '#7f8c8d' }}>
                                        <span style={{ marginRight: '15px' }}>📍 Source: <strong>{systems[p.sourceSystemId] || 'Unknown'}</strong></span>
                                        <span>🎯 Target: <strong>{systems[p.targetSystemId] || 'Unknown'}</strong></span>
                                    </div>
                                    <div style={{ marginTop: '5px', fontSize: '12px', color: '#95a5a6' }}>
                                        Created: {new Date(p.createdDate).toLocaleDateString()}
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate(`/projects/${p.id}`)}
                                    style={{
                                        backgroundColor: 'white',
                                        color: '#007bff',
                                        border: '1px solid #007bff',
                                        padding: '8px 16px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        fontWeight: 600
                                    }}
                                >
                                    Open Editor
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectList;
