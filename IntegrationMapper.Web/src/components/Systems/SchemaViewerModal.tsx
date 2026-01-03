import React, { useEffect, useState } from 'react';
import { SchemaApi } from '../../services/api';

interface SchemaViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    schemaId: number;
    schemaName: string;
}

const SchemaViewerModal: React.FC<SchemaViewerModalProps> = ({ isOpen, onClose, schemaId, schemaName }) => {
    const [content, setContent] = useState<string>('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && schemaId) {
            setLoading(true);
            SchemaApi.getSchemaContent(schemaId)
                .then(setContent)
                .catch(err => setContent("Error loading content: " + err.message))
                .finally(() => setLoading(false));
        } else {
            setContent('');
        }
    }, [isOpen, schemaId]);

    const handleDownload = () => {
        // Assume XSD for now or detect based on content?
        // API handles extension in 'downloadSchema' if we passed filename.
        // We will just append .xsd or .json based on content guess or just generic.
        // Actually the backend 'Download' endpoint endpoint sends the original filename in Content-Disposition usually?
        // But our helper 'downloadFile' takes a filename.
        // Let's rely on user or just append .txt if unsure.
        // Ideally we should know the type.
        // For now, let's just assume it matches the schemaName or just "schema.xsd".
        const filename = schemaName.includes('.') ? schemaName : schemaName + ".xsd";
        SchemaApi.downloadSchema(schemaId, filename);
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'white', padding: '20px', borderRadius: '8px',
                width: '80%', height: '80%', display: 'flex', flexDirection: 'column'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <h3>Schema: {schemaName}</h3>
                    <div>
                        <button onClick={handleDownload} style={{ marginRight: '10px' }}>Download</button>
                        <button onClick={onClose}>Close</button>
                    </div>
                </div>
                <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#f4f4f4', padding: '10px', borderRadius: '4px' }}>
                    {loading ? <p>Loading...</p> : (
                        <pre style={{ margin: 0 }}>{content}</pre>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SchemaViewerModal;
