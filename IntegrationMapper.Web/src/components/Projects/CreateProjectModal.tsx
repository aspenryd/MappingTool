import React, { useState } from 'react';
import { ProjectApi, SystemApi, type IntegrationSystem } from '../../services/api';

interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onProjectCreated: (id: string) => void;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose, onProjectCreated }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [sourceSystemId, setSourceSystemId] = useState<string>('');
    const [targetSystemId, setTargetSystemId] = useState<string>('');
    const [systems, setSystems] = useState<IntegrationSystem[]>([]);

    React.useEffect(() => {
        if (isOpen) {
            SystemApi.getSystems().then(setSystems).catch(console.error);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!sourceSystemId || !targetSystemId) {
            alert('Please select both Source and Target systems.');
            return;
        }

        try {
            const project = await ProjectApi.createProject({
                name,
                description,
                sourceSystemPublicId: sourceSystemId,
                targetSystemPublicId: targetSystemId
            });
            onProjectCreated(project.id);
            onClose();
            setName('');
            setDescription('');
            setSourceSystemId('');
            setTargetSystemId('');
        } catch (err) {
            console.error(err);
            alert('Failed to create project');
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 1000
        }}>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '5px', width: '500px' }}>
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

                    <div style={{ display: 'flex', gap: '20px' }}>
                        <div style={{ flex: 1 }}>
                            <label>Source System:</label>
                            <select
                                value={sourceSystemId}
                                onChange={e => setSourceSystemId(e.target.value)}
                                required
                                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                            >
                                <option value="">Select System...</option>
                                {systems.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ flex: 1 }}>
                            <label>Target System:</label>
                            <select
                                value={targetSystemId}
                                onChange={e => setTargetSystemId(e.target.value)}
                                required
                                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                            >
                                <option value="">Select System...</option>
                                {systems.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                        <button type="button" onClick={onClose} style={{ padding: '8px 16px' }}>Cancel</button>
                        <button
                            type="submit"
                            disabled={!name || !sourceSystemId || !targetSystemId}
                            style={{ padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: (!name || !sourceSystemId || !targetSystemId) ? 0.7 : 1 }}
                        >
                            Create Project
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateProjectModal;
