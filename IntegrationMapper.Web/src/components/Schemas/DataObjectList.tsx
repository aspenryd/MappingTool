import React, { useEffect, useState } from 'react';
import { SchemaApi, type DataObject } from '../../services/api';
import SchemaViewerModal from '../Systems/SchemaViewerModal';

import FileViewerModal from './FileViewerModal';

interface DataObjectListProps {
    systemId: number;
    refreshTrigger: number;
}

const DataObjectList: React.FC<DataObjectListProps> = ({ systemId, refreshTrigger }) => {
    const [objects, setObjects] = useState<DataObject[]>([]);
    const [viewSchema, setViewSchema] = useState<{ id: number, name: string } | null>(null);
    const [viewFile, setViewFile] = useState<{ id: number, name: string } | null>(null);
    const [expandedId, setExpandedId] = useState<number | null>(null);

    useEffect(() => {
        loadObjects();
    }, [systemId, refreshTrigger]);

    const loadObjects = async () => {
        try {
            const data = await SchemaApi.getDataObjects(systemId);
            setObjects(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleUploadClick = (objId: number) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,.xml';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            try {
                await SchemaApi.uploadExample(objId, file);
                alert("Example uploaded successfully!");
                loadObjects(); // Refresh to show new example
            } catch (err: any) {
                // Handle 400 with validation errors
                if (err.response && err.response.data && err.response.data.errors) {
                    alert(`Upload Failed:\n${err.response.data.message}\n\nErrors:\n${err.response.data.errors.join('\n')}`);
                } else if (err.response && err.response.data) {
                    alert(`Upload Failed: ${err.response.data}`);
                } else {
                    alert("Failed to upload example.");
                }
            }
        };
        input.click();
    };

    const handleDeleteExample = async (exampleId: number) => {
        if (!confirm("Are you sure you want to delete this example?")) return;
        try {
            await SchemaApi.deleteExample(exampleId);
            loadObjects();
        } catch (err) {
            alert("Failed to delete example");
        }
    };

    const toggleExpand = (id: number) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <div style={{ marginTop: '20px' }}>
            <h4>Data Objects</h4>
            {objects.length === 0 ? (
                <p>No data objects found.</p>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {objects.map(obj => (
                        <li key={obj.id} style={{ borderBottom: '1px solid #eee', marginBottom: '10px', paddingBottom: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px' }}>
                                <span><strong>{obj.name}</strong> ({obj.schemaType})</span>
                                <div>
                                    <button onClick={() => toggleExpand(obj.id)} style={{ marginRight: '5px' }}>
                                        {expandedId === obj.id ? 'Hide Details' : 'Show Details'}
                                    </button>
                                    <button onClick={() => setViewSchema({ id: obj.id, name: obj.name })} style={{ marginRight: '5px' }}>View Schema</button>
                                    <button onClick={() => SchemaApi.downloadSchema(obj.id, obj.name + (obj.schemaType === 'XSD' ? '.xsd' : '.json'))}>Download</button>
                                </div>
                            </div>

                            {expandedId === obj.id && (
                                <div style={{ marginLeft: '20px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '5px' }}>
                                    <h5>Examples</h5>
                                    {(!obj.examples || obj.examples.length === 0) ? (
                                        <p style={{ fontStyle: 'italic', color: '#666' }}>No examples uploaded.</p>
                                    ) : (
                                        <ul style={{ marginBottom: '10px' }}>
                                            {obj.examples.map(ex => (
                                                <li key={ex.id} style={{ marginBottom: '5px' }}>
                                                    <a href="#" onClick={(e) => {
                                                        e.preventDefault(); SchemaApi.getExampleContent(ex.id).then(c => {
                                                            const blob = new Blob([c], { type: 'text/plain' });
                                                            const url = URL.createObjectURL(blob);
                                                            const a = document.createElement('a');
                                                            a.href = url;
                                                            a.download = ex.fileName;
                                                            a.click();
                                                        })
                                                    }}>{ex.fileName}</a>
                                                    <button onClick={(e) => { e.preventDefault(); setViewFile({ id: ex.id, name: ex.fileName }) }} style={{ marginRight: '10px', fontSize: '0.8em', cursor: 'pointer' }}>View</button>
                                                    <button onClick={() => handleDeleteExample(ex.id)} style={{ marginLeft: '10px', fontSize: '0.8em', color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>Delete</button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    <button onClick={() => handleUploadClick(obj.id)}>+ Upload Example</button>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            {viewSchema && (
                <SchemaViewerModal
                    isOpen={!!viewSchema}
                    onClose={() => setViewSchema(null)}
                    schemaId={viewSchema.id}
                    schemaName={viewSchema.name}
                />
            )}

            {viewFile && (
                <FileViewerModal
                    isOpen={!!viewFile}
                    onClose={() => setViewFile(null)}
                    exampleId={viewFile.id}
                    filename={viewFile.name}
                />
            )}
        </div>
    );
};

export default DataObjectList;
