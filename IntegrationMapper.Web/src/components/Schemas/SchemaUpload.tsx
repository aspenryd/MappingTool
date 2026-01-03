import React, { useState } from 'react';
import { SchemaApi } from '../../services/api';

interface SchemaUploadProps {
    systemId: number;
    onUploadSuccess: () => void;
}

const SchemaUpload: React.FC<SchemaUploadProps> = ({ systemId, onUploadSuccess }) => {
    const [name, setName] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file || !name) {
            alert("Please provide a name and select a file.");
            return;
        }

        try {
            setUploading(true);
            await SchemaApi.ingestSchema(systemId, name, file);
            alert("Schema uploaded successfully!");
            setName('');
            setFile(null);
            onUploadSuccess();
        } catch (error) {
            console.error(error);
            alert("Failed to upload schema.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div style={{ padding: '10px', border: '1px solid #ccc', marginTop: '10px' }}>
            <h4>Upload Schema (JSON/XSD)</h4>
            <input
                type="text"
                placeholder="Object Name (e.g. Customer)"
                value={name}
                onChange={e => setName(e.target.value)}
                style={{ marginRight: '10px', padding: '5px' }}
            />
            <input type="file" accept=".json,.xsd" onChange={handleFileChange} style={{ marginRight: '10px' }} />
            <button onClick={handleUpload} disabled={uploading}>
                {uploading ? 'Uploading...' : 'Upload'}
            </button>
        </div>
    );
};

export default SchemaUpload;
