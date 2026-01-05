import { useCallback, useState } from 'react';
import ReactFlow, {
    type Edge,
    Controls,
    Background,
    Handle,
    Position,
    type OnSelectionChangeParams
} from 'reactflow';
import 'reactflow/dist/style.css';
import { MappingApi } from '../../services/api';
import { useMappingSession } from '../../hooks/useMappingSession';
import CodeViewerModal from '../Layout/CodeViewerModal';
import ExampleViewerModal from './ExampleViewerModal';
import MappingLogicModal from './MappingLogicModal';
import { commonStyles } from '../../styles/common';

interface MappingCanvasProps {
    profilePublicId: string;
    onBack?: () => void;
}

// Custom Node Component for Fields with Tooltip
const FieldNode = ({ data }: { data: { label: string; type: 'source' | 'target'; path: string; description?: string; dataType: string; length?: number; example?: string; sampleValues?: string[]; isArray: boolean; isMandatory: boolean; schemaAttributes?: string } }) => {
    let tooltip = `Path: ${data.path}\nType: ${data.dataType}${data.length ? ` (${data.length})` : ''}\nIsArray: ${data.isArray}\nRequired: ${data.isMandatory}\nDesc: ${data.description || 'N/A'}\nExample: ${data.example || 'N/A'}`;

    if (data.sampleValues && data.sampleValues.length > 0) {
        tooltip += `\n\nSample Values:\n- ${data.sampleValues.join('\n- ')}`;
    }

    if (data.schemaAttributes) {
        try {
            const attrs = JSON.parse(data.schemaAttributes);
            tooltip += `\n\nSchema Attributes:\n${JSON.stringify(attrs, null, 2)}`;
        } catch (e) {
            tooltip += `\n\nSchema Attributes: ${data.schemaAttributes}`;
        }
    }

    return (
        <div
            title={tooltip}
            style={{
                padding: '10px',
                border: '1px solid #777',
                borderRadius: '5px',
                background: 'white',
                minWidth: '180px', // Slightly larger
                cursor: 'pointer', // Indicates draggable/clickable
                position: 'relative'
            }}
        >
            {/* Custom Handle Styles for larger click area */}
            {data.type === 'source' && (
                <Handle
                    type="source"
                    position={Position.Right}
                    style={{ width: '14px', height: '14px', background: '#555', right: '-7px' }}
                />
            )}

            <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: data.isMandatory ? '#d32f2f' : 'inherit' }}>
                    {data.label}
                    {data.isMandatory && '*'}
                </span>
                {data.isArray && <span style={{ fontSize: '0.8em', background: '#eee', padding: '2px 4px', borderRadius: '4px', marginLeft: '5px' }}>[]</span>}
            </div>
            <div style={{ fontSize: '0.8em', color: '#555' }}>
                {data.dataType} {data.length ? `(${data.length})` : ''}
            </div>

            {data.type === 'target' && (
                <Handle
                    type="target"
                    position={Position.Left}
                    style={{ width: '14px', height: '14px', background: '#555', left: '-7px' }}
                />
            )}
        </div>
    );
};

const nodeTypes = {
    field: FieldNode,
};

const MappingCanvas: React.FC<MappingCanvasProps> = ({ profilePublicId, onBack }) => {
    const {
        profileId,
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        onAutoMap,
        onEdgesDelete,
        saveLogic,
        sourceExamples,
        targetExamples
    } = useMappingSession({ profilePublicId });

    // UI Local State
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [selectedEdges, setSelectedEdges] = useState<Edge[]>([]);
    const [isExampleViewerOpen, setIsExampleViewerOpen] = useState(false);
    const [logicModal, setLogicModal] = useState<{ isOpen: boolean; targetId: number; targetName: string; sourceNames: string[]; logic: string } | null>(null);
    const [edgeTooltip, setEdgeTooltip] = useState<{ x: number; y: number; content: string } | null>(null);

    // Code Generation is UI specific, kept here
    const [isCodeViewerOpen, setIsCodeViewerOpen] = useState(false);
    const [generatedCode, setGeneratedCode] = useState('');

    const onSelectionChange = useCallback(({ edges }: OnSelectionChangeParams) => {
        setSelectedEdges(edges);
    }, []);

    const onEdgeMouseEnter = (event: React.MouseEvent, edge: Edge) => {
        if (edge.data?.transformationLogic) {
            setEdgeTooltip({
                x: event.clientX,
                y: event.clientY,
                content: edge.data.transformationLogic
            });
        }
    };

    const onEdgeMouseLeave = () => {
        setEdgeTooltip(null);
    };

    const handleSaveLogic = async (logic: string) => {
        if (!logicModal) return;
        const success = await saveLogic(logicModal.targetId, logic);
        if (success) setLogicModal(null);
    };

    const handleEditSelectedComment = () => {
        if (selectedEdges.length === 0) return;

        // Verify all selected edges target the same field
        const firstTarget = selectedEdges[0].target;
        const allSameTarget = selectedEdges.every(e => e.target === firstTarget);

        if (!allSameTarget) {
            alert("Please select mappings for a single target field to edit the comment/logic.");
            return;
        }

        const targetId = parseInt(firstTarget.replace('target-', ''));
        const targetNode = nodes.find(n => n.id === firstTarget);
        const targetName = targetNode?.data?.label || 'Unknown';

        // Find sources (visual connectivity)
        const allEdgesForTarget = edges.filter(e => e.target === firstTarget);
        const sourceNames = allEdgesForTarget.map(e => {
            const node = nodes.find(n => n.id === e.source);
            return node?.data?.label || 'Unknown';
        });

        // Use logic from the first selected edge (should be consistent)
        setLogicModal({
            isOpen: true,
            targetId,
            targetName,
            sourceNames,
            logic: selectedEdges[0].data?.transformationLogic || ''
        });
    };

    const handleDeleteSelected = () => {
        if (selectedEdges.length > 0) {
            onEdgesDelete(selectedEdges);
            setSelectedEdges([]);
        }
    };

    const handleExportExcel = () => {
        MappingApi.exportExcel(profileId, `Mapping_${profileId}.xlsx`);
    };

    const handleExportCSharp = () => {
        MappingApi.exportCSharp(profileId, `Mapping_${profileId}.cs`);
    };

    const handleViewCode = async () => {
        try {
            const code = await MappingApi.getCSharpCode(profileId);
            setGeneratedCode(code);
            setIsCodeViewerOpen(true);
        } catch (err) {
            console.error(err);
            alert("Failed to fetch code.");
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'Inter, sans-serif' }}>
            <div style={commonStyles.header}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    {onBack && (
                        <button
                            onClick={onBack}
                            style={commonStyles.backButton}
                            title="Back to Project"
                        >
                            ←
                        </button>
                    )}
                    <h2 style={commonStyles.headerTitle}>Mapping Editor</h2>

                    <div style={{ width: '1px', height: '24px', background: '#ddd', margin: '0 10px' }}></div>

                    {/* Toolbar Actions */}
                    <button onClick={onAutoMap} className="toolbar-btn" style={{ ...toolbarBtnStyle, backgroundColor: '#f3e5f5', color: '#7b1fa2' }}>
                        ✨ Auto-Map
                    </button>

                    {selectedEdges.length > 0 && (
                        <>
                            <button onClick={handleEditSelectedComment} className="toolbar-btn" style={{ ...toolbarBtnStyle, backgroundColor: '#fff8e1', color: '#f57c00' }}>
                                ✏️ Edit
                            </button>
                            <button onClick={handleDeleteSelected} className="toolbar-btn" style={{ ...toolbarBtnStyle, backgroundColor: '#ffebee', color: '#c62828' }}>
                                🗑️ Delete
                            </button>
                        </>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', position: 'relative' }}>
                    <button onClick={() => setIsExampleViewerOpen(true)} style={{ ...toolbarBtnStyle, border: '1px solid #ddd' }}>
                        📁 Examples
                    </button>

                    {/* Export Menu */}
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            style={{
                                ...toolbarBtnStyle,
                                backgroundColor: '#212121',
                                color: 'white',
                                border: 'none',
                                paddingRight: '30px'
                            }}
                        >
                            Output / Export ▼
                        </button>

                        {isMenuOpen && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                marginTop: '5px',
                                backgroundColor: 'white',
                                border: '1px solid #ddd',
                                borderRadius: '6px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                minWidth: '200px',
                                zIndex: 1000,
                                overflow: 'hidden'
                            }}>
                                <div onClick={() => { handleViewCode(); setIsMenuOpen(false); }} style={menuItemStyle}>
                                    👁️ View C# Code
                                </div>
                                <div onClick={() => { handleExportCSharp(); setIsMenuOpen(false); }} style={menuItemStyle}>
                                    ⬇️ Download C# (.cs)
                                </div>
                                <div style={{ borderTop: '1px solid #eee' }}></div>
                                <div onClick={() => { handleExportExcel(); setIsMenuOpen(false); }} style={menuItemStyle}>
                                    📊 Export Excel (.xlsx)
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flow-container" style={{ borderTop: '1px solid #eee', backgroundColor: '#fafafa' }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onEdgesDelete={onEdgesDelete}
                    onConnect={onConnect}
                    onSelectionChange={onSelectionChange}
                    onEdgeMouseEnter={onEdgeMouseEnter as any} // Cast for type safety if needed
                    onEdgeMouseLeave={onEdgeMouseLeave}
                    nodeTypes={nodeTypes}
                    fitView
                >
                    <Controls />
                    <Background />
                </ReactFlow>

                {edgeTooltip && (
                    <div style={{
                        position: 'fixed',
                        top: edgeTooltip.y + 10,
                        left: edgeTooltip.x + 10,
                        backgroundColor: '#333',
                        color: 'white',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        zIndex: 2000,
                        pointerEvents: 'none',
                        maxWidth: '300px',
                        whiteSpace: 'pre-wrap',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}>
                        <strong>Logic/Comment:</strong><br />
                        {edgeTooltip.content}
                    </div>
                )}
            </div>

            <CodeViewerModal
                isOpen={isCodeViewerOpen}
                onClose={() => setIsCodeViewerOpen(false)}
                code={generatedCode}
                title="Generated C# Mapper"
            />

            <ExampleViewerModal
                isOpen={isExampleViewerOpen}
                onClose={() => setIsExampleViewerOpen(false)}
                sourceExamples={sourceExamples}
                targetExamples={targetExamples}
            />

            {logicModal && (
                <MappingLogicModal
                    isOpen={!!logicModal}
                    onClose={() => setLogicModal(null)}
                    onSave={handleSaveLogic}
                    currentLogic={logicModal.logic}
                    targetFieldName={logicModal.targetName}
                    sourceFieldNames={logicModal.sourceNames}
                />
            )}
        </div>
    );
};

const toolbarBtnStyle: React.CSSProperties = {
    padding: '8px 14px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s',
    outline: 'none'
};

const menuItemStyle: React.CSSProperties = {
    padding: '10px 16px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#333',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
};

export default MappingCanvas;
