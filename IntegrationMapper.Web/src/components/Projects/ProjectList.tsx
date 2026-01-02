import React, { useEffect, useState } from 'react';
import { ProjectApi, type MappingProject } from '../../services/api';

interface ProjectListProps {
    onSelectProject: (id: number) => void;
    onAddClick: () => void;
}

const ProjectList: React.FC<ProjectListProps> = ({ onSelectProject, onAddClick }) => {
    const [projects, setProjects] = useState<MappingProject[]>([]);

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            const data = await ProjectApi.getAllProjects();
            setProjects(data);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Mapping Projects</h2>
                <button onClick={onAddClick}>Create New Project</button>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, marginTop: '20px' }}>
                {projects.map(p => (
                    <li key={p.id} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                            <strong>{p.name}</strong><br />
                            <small>Created: {new Date(p.createdDate).toLocaleDateString()}</small>
                        </div>
                        <button onClick={() => onSelectProject(p.id)}>Open Editor</button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ProjectList;
