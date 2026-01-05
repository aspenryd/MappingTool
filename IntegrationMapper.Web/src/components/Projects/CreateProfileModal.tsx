import React, { useState, useEffect } from 'react';
import { ProjectApi, SchemaApi, type CreateMappingProfileDto, type DataObject } from '../../services/api';

interface CreateProfileModalProps {
    isOpen: boolean;
    projectId: string;
    sourceSystemId: string;
    targetSystemId: string;
    onClose: () => void;
    onProfileCreated: (profileId: string) => void;
}

const CreateProfileModal: React.FC<CreateProfileModalProps> = ({ isOpen, projectId, sourceSystemId, targetSystemId, onClose, onProfileCreated }) => {
    const [name, setName] = useState('');
    const [sourceObjectId, setSourceObjectId] = useState<string>('');
    const [targetObjectId, setTargetObjectId] = useState<string>('');

    const [sourceObjects, setSourceObjects] = useState<DataObject[]>([]);
    const [targetObjects, setTargetObjects] = useState<DataObject[]>([]);

    useEffect(() => {
        if (isOpen && sourceSystemId && targetSystemId) {
            loadMetaData();
        }
    }, [isOpen, sourceSystemId, targetSystemId]);

    const loadMetaData = async () => {
        try {
            const sObjs = await SchemaApi.getDataObjects(sourceSystemId);
            setSourceObjects(sObjs);

            const tObjs = await SchemaApi.getDataObjects(targetSystemId);
            setTargetObjects(tObjs);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sourceObjectId || !targetObjectId) return;

        const dto: CreateMappingProfileDto = {
            name,
            sourceObjectPublicId: sourceObjectId,
            targetObjectPublicId: targetObjectId
        };

        try {
            const result = await ProjectApi.createProfile(projectId, dto);
            onProfileCreated(result.id);
            onClose();
            setName('');
            setSourceObjectId('');
            setTargetObjectId('');
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
                            onChange={e => setSourceObjectId(e.target.value)}
                            required
                            style={{ width: '100%', padding: '5px' }}
                        >
                            <option value="">Select Source Object...</option>
                            {sourceObjects.map(obj => (
                                <option key={obj.id} value={obj.id}>{obj.name}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ marginBottom: '10px' }}>
                        <label>Target Object:</label>
                        <select
                            value={targetObjectId || ''}
                            onChange={e => setTargetObjectId(e.target.value)}
                            required
                            style={{ width: '100%', padding: '5px' }}
                        >
                            <option value="">Select Target Object...</option>
                            {targetObjects.map(obj => (
                                <option key={obj.id} value={obj.id}>{obj.name}</option>
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
