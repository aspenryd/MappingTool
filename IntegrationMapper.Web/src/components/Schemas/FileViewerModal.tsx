import React, { useEffect, useState } from 'react';
import { SchemaApi } from '../../services/api';

interface FileViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    exampleId: number;
    filename: string;
}

const FileViewerModal: React.FC<FileViewerModalProps> = ({ isOpen, onClose, exampleId, filename }) => {
    const [content, setContent] = useState<string>('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && exampleId) {
            loadFile();
        }
    }, [isOpen, exampleId]);

    const loadFile = async () => {
        setLoading(true);
        try {
            const text = await SchemaApi.getExampleContent(exampleId);
            setContent(text);
        } catch (err) {
            setContent("Failed to load file content.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100
        }}>
            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '5px', width: '800px', height: '80vh', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <h3>Viewing: {filename}</h3>
                    <button onClick={onClose}>Close</button>
                </div>
                <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#f5f5f5', padding: '10px', border: '1px solid #ddd' }}>
                    {loading ? <p>Loading...</p> : (
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                            {content}
                        </pre>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FileViewerModal;
