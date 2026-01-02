import { useCallback, useEffect } from 'react';
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
    Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import { MappingApi, type MappingContextDto, type FieldDefinitionDto, type FieldMappingDto } from '../../services/api';

interface MappingCanvasProps {
    projectId: number;
}

// Custom Node Component for Fields
const FieldNode = ({ data }: { data: { label: string; type: 'source' | 'target'; path: string; description?: string } }) => {
    return (
        <div title={data.description} style={{ padding: '10px', border: '1px solid #777', borderRadius: '5px', background: 'white', minWidth: '150px', cursor: 'help' }}>
            {data.type === 'source' && <Handle type="source" position={Position.Right} />}
            <div style={{ fontWeight: 'bold' }}>{data.label}</div>
            <div style={{ fontSize: '0.8em', color: '#555' }}>{data.path}</div>
            {data.type === 'target' && <Handle type="target" position={Position.Left} />}
        </div>
    );
};

const nodeTypes = {
    field: FieldNode,
};

const MappingCanvas: React.FC<MappingCanvasProps> = ({ projectId }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    // Remove unused state if not needed, but keep for future use or just remove logic that uses it if it was placeholder.
    // The previous error was 'useState' unused, but I *am* using it for local state if I wanted to?
    // Actually, useNodesState uses useState internally, but I imported it explicitly.
    // Let's keep imports clean.

    useEffect(() => {
        loadMappingContext();
    }, [projectId]);

    const loadMappingContext = async () => {
        try {
            const context = await MappingApi.getMappingContext(projectId);
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
        const GAP = 80;

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
                    data: { label: field.name, type, path: field.path, description: field.description },
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
            await MappingApi.saveMapping(projectId, mappingDto);
            setEdges((eds) => addEdge(params, eds));
        } catch (err) {
            alert('Failed to save mapping');
        }
    }, [projectId, setEdges]);

    const onAutoMap = async () => {
        try {
            const suggestions = await MappingApi.suggestMappings(projectId);
            let addedCount = 0;
            const newEdges = [...edges];

            for (const s of suggestions) {
                // Check if edge already exists
                const edgeId = `e${s.sourceFieldId}-${s.targetFieldId}`;
                if (!newEdges.find(e => e.id === edgeId)) {
                    // Save mapping
                    await MappingApi.saveMapping(projectId, {
                        sourceFieldId: s.sourceFieldId,
                        targetFieldId: s.targetFieldId,
                        transformationLogic: null
                    });

                    // Add edge to local state
                    newEdges.push({
                        id: edgeId,
                        source: `source-${s.sourceFieldId}`,
                        target: `target-${s.targetFieldId}`,
                        animated: true,
                        style: { stroke: '#ff0072' } // Highlight auto-mapped edges
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

    return (
        <div style={{ width: '100%', height: '800px', border: '1px solid #eee', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }}>
                <button onClick={onAutoMap} style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                    ✨ Auto-Map (AI)
                </button>
            </div>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
            >
                <Controls />
                <Background />
            </ReactFlow>
        </div>
    );
};

export default MappingCanvas;
