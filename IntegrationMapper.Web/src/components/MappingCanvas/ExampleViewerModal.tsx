import React from 'react';
import { SchemaApi, type DataObjectExampleDto } from '../../services/api';

interface ExampleViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    sourceExamples: DataObjectExampleDto[];
    targetExamples: DataObjectExampleDto[];
    sourceIsUploadable?: boolean; // If we want to allow upload from here later
}

const ExampleViewerModal: React.FC<ExampleViewerModalProps> = ({ isOpen, onClose, sourceExamples, targetExamples }) => {
    if (!isOpen) return null;

    const handleDownload = async (id: string, filename: string) => {
        try {
            const text = await SchemaApi.getExampleContent(id);
            // Create blob and download
            const blob = new Blob([text], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (e) {
            console.error(e);
            alert("Failed to download example");
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '5px', width: '600px', maxHeight: '80vh', overflow: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <h3>Example Files</h3>
                    <button onClick={onClose}>Close</button>
                </div>

                <div style={{ display: 'flex', gap: '20px' }}>
                    <div style={{ flex: 1 }}>
                        <h4>Source Examples</h4>
                        {sourceExamples.length === 0 ? <p style={{ color: '#888' }}>No examples.</p> : (
                            <ul style={{ paddingLeft: '20px' }}>
                                {sourceExamples.map(e => (
                                    <li key={e.id} style={{ marginBottom: '5px' }}>
                                        <a href="#" onClick={(evt) => { evt.preventDefault(); handleDownload(e.id, e.fileName); }}>
                                            {e.fileName}
                                        </a>
                                        <div style={{ fontSize: '0.8em', color: '#666' }}>{new Date(e.uploadedAt).toLocaleString()}</div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div style={{ flex: 1 }}>
                        <h4>Target Examples</h4>
                        {targetExamples.length === 0 ? <p style={{ color: '#888' }}>No examples.</p> : (
                            <ul style={{ paddingLeft: '20px' }}>
                                {targetExamples.map(e => (
                                    <li key={e.id} style={{ marginBottom: '5px' }}>
                                        <a href="#" onClick={(evt) => { evt.preventDefault(); handleDownload(e.id, e.fileName); }}>
                                            {e.fileName}
                                        </a>
                                        <div style={{ fontSize: '0.8em', color: '#666' }}>{new Date(e.uploadedAt).toLocaleString()}</div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExampleViewerModal;
