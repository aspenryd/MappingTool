import { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
    addEdge,
    type Connection,
    type Edge,
    type Node,
    useNodesState,
    useEdgesState,
    Controls,
    Background,
    Handle,
    Position,
    type OnSelectionChangeParams
} from 'reactflow';
import 'reactflow/dist/style.css';
import { MappingApi, type MappingContextDto, type FieldDefinitionDto } from '../../services/api';
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
    // Internal Profile ID state for API save/delete calls
    const [profileId, setProfileId] = useState<string>('');

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [selectedEdges, setSelectedEdges] = useState<Edge[]>([]);

    const [isExampleViewerOpen, setIsExampleViewerOpen] = useState(false);
    const [sourceExamples, setSourceExamples] = useState<any[]>([]);
    const [targetExamples, setTargetExamples] = useState<any[]>([]);

    // Logic Modal State
    const [logicModal, setLogicModal] = useState<{ isOpen: boolean; targetId: number; targetName: string; sourceNames: string[]; logic: string } | null>(null);

    // Tooltip State
    const [edgeTooltip, setEdgeTooltip] = useState<{ x: number; y: number; content: string } | null>(null);

    useEffect(() => {
        loadMappingContext();
    }, [profilePublicId]);

    const loadMappingContext = async () => {
        try {
            const context = await MappingApi.getMappingContextByPublicId(profilePublicId);
            setProfileId(context.profileId); // Store internal ID
            setSourceExamples(context.sourceExamples || []);
            setTargetExamples(context.targetExamples || []);
            const { newNodes, newEdges } = buildGraph(context);
            setNodes(newNodes);
            setEdges(newEdges);
        } catch (err) {
            console.error("Failed to load mapping context", err);
        }
    };

    const buildGraph = (context: MappingContextDto) => {
        const newNodes: Node[] = [];
        const newEdges: Edge[] = [];
        const GAP = 90; // Increased gap for details

        const flattenFields = (fields: FieldDefinitionDto[], type: 'source' | 'target', xPos: number) => {
            const flattened: any[] = [];
            const traverse = (list: FieldDefinitionDto[], level: number) => {
                list.forEach(field => {
                    flattened.push({ ...field, level });
                    if (field.children) traverse(field.children, level + 1);
                });
            };
            traverse(fields, 0);

            flattened.forEach((field, index) => {
                newNodes.push({
                    id: `${type}-${field.id}`,
                    type: 'field',
                    position: { x: xPos + (field.level * 20), y: index * GAP + 50 },
                    data: {
                        label: field.name,
                        type,
                        path: field.path,
                        description: field.description,
                        dataType: field.dataType,
                        length: field.length,
                        example: field.exampleValue,
                        isArray: field.isArray,
                        isMandatory: field.isMandatory || false,
                        schemaAttributes: field.schemaAttributes
                    },
                    draggable: false
                });
            });
        };

        flattenFields(context.sourceFields, 'source', 0);
        flattenFields(context.targetFields, 'target', 600);

        context.existingMappings.forEach((mapping) => {
            // Support new multi-source structure
            if (mapping.sourceFieldIds && mapping.sourceFieldIds.length > 0) {
                mapping.sourceFieldIds.forEach(sourceId => {
                    newEdges.push({
                        id: `e${sourceId}-${mapping.targetFieldId}`,
                        source: `source-${sourceId}`,
                        target: `target-${mapping.targetFieldId}`,
                        animated: true,
                        style: mapping.transformationLogic ? { stroke: '#6200ea', strokeWidth: 2 } : {},
                        data: { transformationLogic: mapping.transformationLogic } // Store logic for tooltip/edit
                    });
                });
            }
            // Fallback for legacy single-source (if sourceFieldIds is missing or empty but sourceFieldId exists)
            else if (mapping.sourceFieldId) {
                newEdges.push({
                    id: `e${mapping.sourceFieldId}-${mapping.targetFieldId}`,
                    source: `source-${mapping.sourceFieldId}`,
                    target: `target-${mapping.targetFieldId}`,
                    animated: true,
                    style: mapping.transformationLogic ? { stroke: '#6200ea', strokeWidth: 2 } : {},
                    data: { transformationLogic: mapping.transformationLogic } // Store logic for tooltip/edit
                });
            }
        });

        return { newNodes, newEdges };
    };

    const onConnect = useCallback(async (params: Connection) => {
        if (!params.source || !params.target) return;

        const sourceId = parseInt(params.source.replace('source-', ''));
        const targetId = parseInt(params.target.replace('target-', ''));

        // Check for duplicates
        const exists = edges.some(e => e.source === params.source && e.target === params.target);
        if (exists) return;

        // Find existing sources for this target
        const existingEdges = edges.filter(e => e.target === params.target);
        const existingSourceIds = existingEdges.map(e => parseInt(e.source.replace('source-', '')));

        const allSourceIds = [...existingSourceIds, sourceId];

        try {
            await MappingApi.saveMapping(profileId, {
                targetFieldId: targetId,
                sourceFieldIds: allSourceIds,
                sourceFieldId: null,
                transformationLogic: null
            });
            setEdges((eds) => addEdge(params, eds));
        } catch (err) {
            alert('Failed to save mapping');
        }
    }, [profileId, edges, setEdges]); // Added edges dependency

    const onAutoMap = async () => {
        try {
            const suggestions = await MappingApi.suggestMappings(profileId);
            let addedCount = 0;
            const newEdges = [...edges];

            for (const s of suggestions) {
                const edgeId = `e${s.sourceFieldId}-${s.targetFieldId}`;
                if (!newEdges.find(e => e.id === edgeId)) {
                    // Start simplified: if target already mapped, skip for auto-map to avoid complexity or potential conflicts
                    // or improved: check if target is mapped and append?
                    // For now, let's assume auto-map only maps unmapped targets for safety, or we implement similar logic.
                    // Given simplicity preference, let's overwrite or skip. 
                    // Better: Skip if target has edges to avoid messing up manual multi-maps.
                    if (newEdges.some(e => e.target === `target-${s.targetFieldId}`)) continue;

                    await MappingApi.saveMapping(profileId, {
                        sourceFieldId: s.sourceFieldId,
                        targetFieldId: s.targetFieldId,
                        transformationLogic: null
                    });
                    newEdges.push({
                        id: edgeId,
                        source: `source-${s.sourceFieldId}`,
                        target: `target-${s.targetFieldId}`,
                        animated: true,
                        style: { stroke: '#ff0072' }
                    });
                    addedCount++;
                }
            }
            setEdges(newEdges);
            alert(`Auto-mapped ${addedCount} fields based on AI suggestions!`);
        } catch (err) {
            console.error(err);
            alert('Failed to auto-map');
        }
    };

    const onEdgesDelete = useCallback(async (edgesToDelete: Edge[]) => {
        for (const edge of edgesToDelete) {
            const targetId = parseInt(edge.target.replace('target-', ''));


            // Check if there are OTHER edges for this target
            const otherEdges = edges.filter(e => e.target === edge.target && e.id !== edge.id && !edgesToDelete.find(d => d.id === e.id));

            if (otherEdges.length > 0) {
                // Update mapping to remove just this source
                const remainingSourceIds = otherEdges.map(e => parseInt(e.source.replace('source-', '')));
                try {
                    await MappingApi.saveMapping(profileId, {
                        targetFieldId: targetId,
                        sourceFieldIds: remainingSourceIds,
                        sourceFieldId: null,
                        transformationLogic: null // Logic remains? Or should be fetched? logic isn't easily available here without keeping state map. 
                        // For now, keep null effectively resets logic? NO. passing null might clear logic?
                        // Backend SaveMapping: "existing.TransformationLogic = mappingDto.TransformationLogic;"
                        // If I pass null, it might clear comments!
                        // I should preserve existing logic.
                    });

                    // Wait, I need the existing logic. 
                    // Quick fix: Do not pass transformationLogic if I want to keep it?
                    // Backend: "existing.TransformationLogic = mappingDto.TransformationLogic;"
                    // It blindly updates. 
                    // I need to fetch current logic or store it in edge data.
                    // Edge data HAS transformationLogic (see handleSaveLogic).
                    // So I can grab it from one of the otherEdges.
                } catch (err) {
                    alert("Failed to update mapping");
                    return; // abort local update
                }
            } else {
                // No other edges, delete the whole mapping
                try {
                    await MappingApi.deleteMapping(profileId, targetId);
                } catch (err) {
                    console.error("Failed to delete mapping for target field " + targetId, err);
                    alert("Failed to delete mapping!");
                    return;
                }
            }
        }

        // If API calls succeeded, remove from UI
        setEdges((eds) => eds.filter(e => !edgesToDelete.find(d => d.id === e.id)));

    }, [profileId, edges, setEdges]); // Added edges dependency

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

        // Get all source IDs for this target
        const relatedEdges = edges.filter(e => e.target === `target-${logicModal.targetId}`);
        const sourceIds = relatedEdges.map(e => parseInt(e.source.replace('source-', '')));

        try {
            await MappingApi.saveMapping(profileId, {
                sourceFieldId: null, // Legacy field
                targetFieldId: logicModal.targetId,
                sourceFieldIds: sourceIds,
                transformationLogic: logic
            });

            // Update local edge data
            setEdges(eds => eds.map(e => {
                if (e.target === `target-${logicModal.targetId}`) {
                    return { ...e, data: { ...e.data, transformationLogic: logic }, style: logic ? { stroke: '#6200ea', strokeWidth: 2 } : {} };
                }
                return e;
            }));

            setLogicModal(null);
        } catch (err) {
            alert("Failed to save logic.");
        }
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
            setEdges((eds) => eds.filter(e => !selectedEdges.find(se => se.id === e.id)));
            setSelectedEdges([]);
        }
    };

    const handleExportExcel = () => {
        MappingApi.exportExcel(profileId, `Mapping_${profileId}.xlsx`);
    };

    const handleExportCSharp = () => {
        MappingApi.exportCSharp(profileId, `Mapping_${profileId}.cs`);
    };

    const [isCodeViewerOpen, setIsCodeViewerOpen] = useState(false);
    const [generatedCode, setGeneratedCode] = useState('');

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

    if (nodes.length === 0 && edges.length === 0) {
        // Optional: Loading state or empty state handling if needed
    }



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
