import React, { useState } from 'react';
import { ProjectApi } from '../../services/api';

interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onProjectCreated: (id: number) => void;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose, onProjectCreated }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const project = await ProjectApi.createProject({
                name,
                description
            });
            onProjectCreated(project.id);
            onClose();
            setName('');
            setDescription('');
        } catch (err) {
            console.error(err);
            alert('Failed to create project');
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '5px', width: '400px' }}>
                <h3>Create Mapping Project</h3>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div>
                        <label>Project Name:</label>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                            placeholder="e.g. ERP to CRM Migration"
                        />
                    </div>

                    <div>
                        <label>Description:</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            style={{ width: '100%', padding: '8px', marginTop: '5px', minHeight: '60px' }}
                            placeholder="Optional description..."
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button type="button" onClick={onClose}>Cancel</button>
                        <button type="submit" disabled={!name}>Create Project</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateProjectModal;
