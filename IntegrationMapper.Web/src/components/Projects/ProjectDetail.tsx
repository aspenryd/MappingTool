import React, { useEffect, useState } from 'react';
import { ProjectApi, type MappingProject } from '../../services/api';
import CreateProfileModal from './CreateProfileModal';

interface ProjectDetailProps {
    projectId: number;
    onBack: () => void;
    onSelectProfile: (profileId: number) => void;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({ projectId, onBack, onSelectProfile }) => {
    const [project, setProject] = useState<MappingProject | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAddProfileOpen, setIsAddProfileOpen] = useState(false);

    useEffect(() => {
        loadProject();
    }, [projectId]);

    const loadProject = async () => {
        try {
            setLoading(true);
            const data = await ProjectApi.getProject(projectId);
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
        <div style={{ padding: '20px' }}>
            <button onClick={onBack} style={{ marginBottom: '10px' }}>&larr; Back to Projects</button>

            <div style={{ borderBottom: '1px solid #eee', paddingBottom: '20px', marginBottom: '20px' }}>
                <h2>{project.name}</h2>
                <p>{project.description || 'No description'}</p>
                <small>Created: {new Date(project.createdDate).toLocaleString()}</small>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3>Mapping Profiles</h3>
                <button onClick={() => setIsAddProfileOpen(true)}>+ Add Mapping Profile</button>
            </div>

            {project.profiles && project.profiles.length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {project.profiles.map(profile => (
                        <li key={profile.id} style={{
                            border: '1px solid #ddd',
                            padding: '15px',
                            marginBottom: '10px',
                            borderRadius: '4px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            backgroundColor: '#f9f9f9'
                        }}>
                            <div>
                                <strong style={{ fontSize: '1.1em' }}>{profile.name}</strong>
                                <div style={{ color: '#666', marginTop: '5px' }}>
                                    {profile.sourceObjectName} &rarr; {profile.targetObjectName}
                                </div>
                            </div>
                            <button
                                onClick={() => onSelectProfile(profile.id)}
                                style={{ padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                Open Canvas
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p style={{ fontStyle: 'italic', color: '#888' }}>No mapping profiles created yet. Add one to start mapping.</p>
            )}

            <CreateProfileModal
                isOpen={isAddProfileOpen}
                projectId={projectId}
                onClose={() => setIsAddProfileOpen(false)}
                onProfileCreated={(id) => {
                    loadProject();
                }}
            />
        </div>
    );
};

export default ProjectDetail;
