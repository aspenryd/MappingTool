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
import { MappingApi, type MappingContextDto, type FieldDefinitionDto, type FieldMappingDto } from '../../services/api';
import CodeViewerModal from '../Layout/CodeViewerModal';
import ExampleViewerModal from './ExampleViewerModal';
import MappingLogicModal from './MappingLogicModal';

interface MappingCanvasProps {
    profileId: number;
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
            style={{ padding: '10px', border: '1px solid #777', borderRadius: '5px', background: 'white', minWidth: '150px', cursor: 'help' }}
        >
            {data.type === 'source' && <Handle type="source" position={Position.Right} />}
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
            {data.type === 'target' && <Handle type="target" position={Position.Left} />}
        </div>
    );
};

const nodeTypes = {
    field: FieldNode,
};

const MappingCanvas: React.FC<MappingCanvasProps> = ({ profileId }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [selectedEdges, setSelectedEdges] = useState<Edge[]>([]);

    const [isExampleViewerOpen, setIsExampleViewerOpen] = useState(false);
    const [sourceExamples, setSourceExamples] = useState<any[]>([]);
    const [targetExamples, setTargetExamples] = useState<any[]>([]);

    // Logic Modal State
    const [logicModal, setLogicModal] = useState<{ isOpen: boolean; targetId: number; targetName: string; sourceNames: string[]; logic: string } | null>(null);

    useEffect(() => {
        loadMappingContext();
    }, [profileId]);

    const loadMappingContext = async () => {
        try {
            const context = await MappingApi.getMappingContext(profileId);
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
            if (mapping.sourceFieldId && mapping.targetFieldId) {
                newEdges.push({
                    id: `e${mapping.sourceFieldId}-${mapping.targetFieldId}`,
                    source: `source-${mapping.sourceFieldId}`,
                    target: `target-${mapping.targetFieldId}`,
                    animated: true
                });
            }
        });

        return { newNodes, newEdges };
    };

    const onConnect = useCallback(async (params: Connection) => {
        if (!params.source || !params.target) return;

        const sourceId = parseInt(params.source.replace('source-', ''));
        const targetId = parseInt(params.target.replace('target-', ''));

        // Prepare DTO
        const mappingDto: FieldMappingDto = {
            sourceFieldId: sourceId,
            targetFieldId: targetId,
            transformationLogic: null // explicitly null to match type
        };

        try {
            await MappingApi.saveMapping(profileId, mappingDto);
            setEdges((eds) => addEdge(params, eds));
        } catch (err) {
            alert('Failed to save mapping');
        }
    }, [profileId, setEdges]);

    const onAutoMap = async () => {
        try {
            const suggestions = await MappingApi.suggestMappings(profileId);
            let addedCount = 0;
            const newEdges = [...edges];

            for (const s of suggestions) {
                const edgeId = `e${s.sourceFieldId}-${s.targetFieldId}`;
                if (!newEdges.find(e => e.id === edgeId)) {
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
            try {
                await MappingApi.deleteMapping(profileId, targetId);
            } catch (err) {
                console.error("Failed to delete mapping for target field " + targetId, err);
                alert("Failed to delete mapping!");
            }
        }
    }, [profileId]);

    const onSelectionChange = useCallback(({ edges }: OnSelectionChangeParams) => {
        setSelectedEdges(edges);
    }, []);

    const handleSaveLogic = async (logic: string) => {
        if (!logicModal) return;

        // Get all source IDs for this target
        const relatedEdges = edges.filter(e => e.target === `target-${logicModal.targetId}`);
        const sourceIds = relatedEdges.map(e => parseInt(e.source.replace('source-', '')));

        try {
            await MappingApi.saveMapping(profileId, {
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
        <div style={{ display: 'flex', flexDirection: 'column', height: '800px' }}>
            <div style={{ padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8f9fa', borderBottom: '1px solid #ddd' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <strong style={{ marginRight: '10px', color: '#555' }}>Mapping Actions:</strong>
                    <button onClick={onAutoMap} style={{ backgroundColor: '#6200ea', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        ✨ Auto-Map (AI)
                    </button>
                    {selectedEdges.length > 0 && (
                        <>
                            <button onClick={handleEditSelectedComment} style={{ backgroundColor: '#ffc107', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', marginRight: '5px' }}>
                                ✏️ Edit Comment
                            </button>
                            <button onClick={handleDeleteSelected} style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>
                                🗑️ Delete Selected
                            </button>
                        </>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button onClick={() => setIsExampleViewerOpen(true)} style={{ backgroundColor: '#e9ecef', color: '#333', border: '1px solid #ccc', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>
                        📁 View Examples
                    </button>
                    <strong style={{ marginRight: '10px', marginLeft: '10px', color: '#555' }}>Output:</strong>
                    <button onClick={handleViewCode} style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>
                        👁️ View C#
                    </button>
                    <button onClick={handleExportCSharp} style={{ backgroundColor: '#68217a', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>
                        ⬇️ Download C#
                    </button>
                    <button onClick={handleExportExcel} style={{ backgroundColor: '#217346', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>
                        📊 Export Excel
                    </button>
                </div>
            </div>

            <div style={{ flex: 1, border: '1px solid #eee', position: 'relative' }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onEdgesDelete={onEdgesDelete}
                    onConnect={onConnect}
                    onSelectionChange={onSelectionChange}
                    nodeTypes={nodeTypes}
                    fitView
                >
                    <Controls />
                    <Background />
                </ReactFlow>
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

export default MappingCanvas;
