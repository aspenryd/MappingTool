import React, { useState } from 'react';
import { SystemApi, type CreateSystemDto } from '../../services/api';

interface AddSystemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSystemAdded: () => void;
}

const AddSystemModal: React.FC<AddSystemModalProps> = ({ isOpen, onClose, onSystemAdded }) => {
    const [formData, setFormData] = useState<CreateSystemDto>({
        name: '',
        description: '',
        category: '',
        externalId: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await SystemApi.createSystem(formData);
            onSystemAdded();
            onClose();
            setFormData({ name: '', description: '', category: '', externalId: '' }); // Reset form
        } catch (err) {
            alert('Failed to create system');
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '5px', width: '400px' }}>
                <h3>Add New System</h3>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input
                        placeholder="Name"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        required
                        style={{ padding: '8px' }}
                    />
                    <input
                        placeholder="Category (e.g., CRM, ERP)"
                        value={formData.category}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                        style={{ padding: '8px' }}
                    />
                    <input
                        placeholder="External ID"
                        value={formData.externalId}
                        onChange={e => setFormData({ ...formData, externalId: e.target.value })}
                        style={{ padding: '8px' }}
                    />
                    <textarea
                        placeholder="Description"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        style={{ padding: '8px', minHeight: '60px' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                        <button type="button" onClick={onClose}>Cancel</button>
                        <button type="submit">Create</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddSystemModal;
