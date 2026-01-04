import React, { useState, useEffect } from 'react';

interface MappingLogicModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (logic: string) => void;
    currentLogic: string;
    targetFieldName: string;
    sourceFieldNames: string[];
}

const MappingLogicModal: React.FC<MappingLogicModalProps> = ({
    isOpen, onClose, onSave, currentLogic, targetFieldName, sourceFieldNames
}) => {
    const [logic, setLogic] = useState(currentLogic || '');

    useEffect(() => {
        setLogic(currentLogic || '');
    }, [currentLogic, isOpen]);

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1200
        }}>
            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '5px', width: '500px', display: 'flex', flexDirection: 'column' }}>
                <h3>Mapping Logic: {targetFieldName}</h3>
                <div style={{ marginBottom: '15px' }}>
                    <p style={{ margin: '5px 0', fontWeight: 'bold' }}>Sources:</p>
                    <ul style={{ margin: '0 0 10px 20px', color: '#555' }}>
                        {sourceFieldNames.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                </div>

                <label style={{ fontWeight: 'bold', marginBottom: '5px' }}>Transformation Logic / Comment:</label>
                <textarea
                    value={logic}
                    onChange={e => setLogic(e.target.value)}
                    rows={5}
                    placeholder="e.g. Concatenate Name and Surname..."
                    style={{ padding: '8px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc', marginBottom: '15px' }}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button onClick={onClose} style={{ padding: '8px 16px', cursor: 'pointer', background: 'none', border: '1px solid #ccc', borderRadius: '4px' }}>Cancel</button>
                    <button onClick={() => onSave(logic)} style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>Save</button>
                </div>
            </div>
        </div>
    );
};

export default MappingLogicModal;
