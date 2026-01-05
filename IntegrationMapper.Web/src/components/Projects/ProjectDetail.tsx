import React, { useEffect, useState } from 'react';
import { ProjectApi, type MappingProject } from '../../services/api';
import CreateProfileModal from './CreateProfileModal';
import { useNavigate } from 'react-router-dom';

interface ProjectDetailProps {
    publicId: string;
    onBack: () => void;
}

import { commonStyles } from '../../styles/common';

const ProjectDetail: React.FC<ProjectDetailProps> = ({ publicId, onBack }) => {
    const [project, setProject] = useState<MappingProject | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAddProfileOpen, setIsAddProfileOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        loadProject();
    }, [publicId]);

    const loadProject = async () => {
        try {
            setLoading(true);
            const data = await ProjectApi.getByPublicId(publicId);
            setProject(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading Project...</div>;
    if (!project) return <div>Project not found</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Standard Header */}
            <div style={commonStyles.header}>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <button onClick={onBack} style={commonStyles.backButton} title="Back to Projects">
                        ←
                    </button>
                    <div>
                        <h2 style={commonStyles.headerTitle}>{project.name}</h2>
                        <div style={{ fontSize: '12px', color: '#777' }}>
                            Created: {new Date(project.createdDate).toLocaleDateString()}
                        </div>
                    </div>
                </div>
                <button onClick={() => setIsAddProfileOpen(true)} style={commonStyles.primaryButton}>
                    + Add Profile
                </button>
            </div>

            <div style={{ ...commonStyles.container, flex: 1, overflowY: 'auto' }}>
                <div style={{ marginBottom: '20px', color: '#555' }}>
                    {project.description || 'No description provided.'}
                </div>

                <h3>Mapping Profiles</h3>

                {project.profiles && project.profiles.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {project.profiles.map(profile => (
                            <div key={profile.id} style={commonStyles.listItem}>
                                <div>
                                    <strong style={{ fontSize: '1.1em', display: 'block', marginBottom: '5px' }}>{profile.name}</strong>
                                    <div style={{ color: '#666', fontSize: '14px' }}>
                                        <span style={{ marginRight: '15px' }}>📍 Source: <strong>{profile.sourceObjectName}</strong></span>
                                        <span>🎯 Target: <strong>{profile.targetObjectName}</strong></span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate(`/mapping/${profile.id}`)} // Use ID which is now Guid
                                    style={{
                                        ...commonStyles.primaryButton,
                                        backgroundColor: 'white',
                                        color: '#007bff',
                                        border: '1px solid #007bff'
                                    }}
                                >
                                    Open Canvas
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px', background: '#f9f9f9', borderRadius: '8px', color: '#888' }}>
                        No mapping profiles created yet. <br />
                        Click "Add Profile" to define a source-to-target mapping.
                    </div>
                )}
            </div>

            <CreateProfileModal
                isOpen={isAddProfileOpen}
                projectId={project.id}
                sourceSystemId={project?.sourceSystemId || ''}
                targetSystemId={project?.targetSystemId || ''}
                onClose={() => setIsAddProfileOpen(false)}
                onProfileCreated={() => {
                    loadProject();
                }}
            />
        </div>
    );
};

export default ProjectDetail;
