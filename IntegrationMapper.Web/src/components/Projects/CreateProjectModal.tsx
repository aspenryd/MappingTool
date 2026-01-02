import React, { useState, useEffect } from 'react';
import { SystemApi, SchemaApi, ProjectApi, type IntegrationSystem, type DataObject } from '../../services/api';

interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onProjectCreated: (id: number) => void;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose, onProjectCreated }) => {
    const [name, setName] = useState('');
    const [systems, setSystems] = useState<IntegrationSystem[]>([]);

    const [sourceSystemId, setSourceSystemId] = useState<number | ''>('');
    const [sourceObjects, setSourceObjects] = useState<DataObject[]>([]);
    const [sourceObjectId, setSourceObjectId] = useState<number | ''>('');

    const [targetSystemId, setTargetSystemId] = useState<number | ''>('');
    const [targetObjects, setTargetObjects] = useState<DataObject[]>([]);
    const [targetObjectId, setTargetObjectId] = useState<number | ''>('');

    useEffect(() => {
        if (isOpen) {
            SystemApi.getSystems().then(setSystems);
        }
    }, [isOpen]);

    useEffect(() => {
        if (sourceSystemId) {
            SchemaApi.getDataObjects(Number(sourceSystemId)).then(setSourceObjects);
        } else {
            setSourceObjects([]);
        }
    }, [sourceSystemId]);

    useEffect(() => {
        if (targetSystemId) {
            SchemaApi.getDataObjects(Number(targetSystemId)).then(setTargetObjects);
        } else {
            setTargetObjects([]);
        }
    }, [targetSystemId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sourceObjectId || !targetObjectId) return;

        try {
            const project = await ProjectApi.createProject({
                name,
                sourceObjectId: Number(sourceObjectId),
                targetObjectId: Number(targetObjectId)
            });
            onProjectCreated(project.id);
            onClose();
        } catch (err) {
            alert('Failed to create project');
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '5px', width: '500px' }}>
                <h3>Create Mapping Project</h3>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input
                        placeholder="Project Name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                        style={{ padding: '8px' }}
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                            <h4>Source</h4>
                            <select value={sourceSystemId} onChange={e => setSourceSystemId(Number(e.target.value))} style={{ width: '100%', marginBottom: '5px' }}>
                                <option value="">Select System</option>
                                {systems.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            <select value={sourceObjectId} onChange={e => setSourceObjectId(Number(e.target.value))} style={{ width: '100%' }} disabled={!sourceSystemId}>
                                <option value="">Select Data Object</option>
                                {sourceObjects.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <h4>Target</h4>
                            <select value={targetSystemId} onChange={e => setTargetSystemId(Number(e.target.value))} style={{ width: '100%', marginBottom: '5px' }}>
                                <option value="">Select System</option>
                                {systems.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            <select value={targetObjectId} onChange={e => setTargetObjectId(Number(e.target.value))} style={{ width: '100%' }} disabled={!targetSystemId}>
                                <option value="">Select Data Object</option>
                                {targetObjects.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                        <button type="button" onClick={onClose}>Cancel</button>
                        <button type="submit" disabled={!sourceObjectId || !targetObjectId}>Create</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateProjectModal;
