import React, { useState, useEffect } from 'react';
import { ProjectApi, SchemaApi, type CreateMappingProfileDto, type DataObject, type IntegrationSystem, SystemApi } from '../../services/api';

interface CreateProfileModalProps {
    isOpen: boolean;
    projectId: number;
    onClose: () => void;
    onProfileCreated: (profileId: number) => void;
}

const CreateProfileModal: React.FC<CreateProfileModalProps> = ({ isOpen, projectId, onClose, onProfileCreated }) => {
    const [name, setName] = useState('');
    const [sourceObjectId, setSourceObjectId] = useState<number | null>(null);
    const [targetObjectId, setTargetObjectId] = useState<number | null>(null);

    // Grouping by System
    const [systems, setSystems] = useState<IntegrationSystem[]>([]);
    const [systemObjects, setSystemObjects] = useState<{ [key: number]: DataObject[] }>({});

    useEffect(() => {
        if (isOpen) {
            loadMetaData();
        }
    }, [isOpen]);

    const loadMetaData = async () => {
        try {
            const sys = await SystemApi.getSystems();
            setSystems(sys);

            const objectsMap: { [key: number]: DataObject[] } = {};
            for (const s of sys) {
                const objs = await SchemaApi.getDataObjects(s.id);
                objectsMap[s.id] = objs;
            }
            setSystemObjects(objectsMap);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sourceObjectId || !targetObjectId) return;

        const dto: CreateMappingProfileDto = {
            name,
            sourceObjectId,
            targetObjectId
        };

        try {
            const result = await ProjectApi.createProfile(projectId, dto);
            onProfileCreated(result.id);
            onClose();
            setName('');
            setSourceObjectId(null);
            setTargetObjectId(null);
        } catch (err) {
            console.error(err);
            alert('Failed to create profile');
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '5px', width: '500px' }}>
                <h3>Add Mapping Profile</h3>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '10px' }}>
                        <label>Profile Name:</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                            style={{ width: '100%', padding: '5px' }}
                            placeholder="e.g. Order Header Map"
                        />
                    </div>

                    <div style={{ marginBottom: '10px' }}>
                        <label>Source Object:</label>
                        <select
                            value={sourceObjectId || ''}
                            onChange={e => setSourceObjectId(Number(e.target.value))}
                            required
                            style={{ width: '100%', padding: '5px' }}
                        >
                            <option value="">Select Source Object...</option>
                            {systems.map(sys => (
                                <optgroup key={sys.id} label={sys.name}>
                                    {systemObjects[sys.id]?.map(obj => (
                                        <option key={obj.id} value={obj.id}>{obj.name}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </div>

                    <div style={{ marginBottom: '10px' }}>
                        <label>Target Object:</label>
                        <select
                            value={targetObjectId || ''}
                            onChange={e => setTargetObjectId(Number(e.target.value))}
                            required
                            style={{ width: '100%', padding: '5px' }}
                        >
                            <option value="">Select Target Object...</option>
                            {systems.map(sys => (
                                <optgroup key={sys.id} label={sys.name}>
                                    {systemObjects[sys.id]?.map(obj => (
                                        <option key={obj.id} value={obj.id}>{obj.name}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'flex', justifySelf: 'end', gap: '10px' }}>
                        <button type="button" onClick={onClose}>Cancel</button>
                        <button type="submit">Create Profile</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateProfileModal;
