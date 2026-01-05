import { useState, useEffect, useCallback } from 'react';
import { useNodesState, useEdgesState, addEdge, type Connection, type Edge, type Node } from 'reactflow';
import { MappingApi, type MappingContextDto, type FieldDefinitionDto } from '../services/api';

interface UseMappingSessionProps {
    profilePublicId: string;
}

export const useMappingSession = ({ profilePublicId }: UseMappingSessionProps) => {
    const [profileId, setProfileId] = useState<string>('');
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [sourceExamples, setSourceExamples] = useState<any[]>([]);
    const [targetExamples, setTargetExamples] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (profilePublicId) {
            loadMappingContext();
        }
    }, [profilePublicId]);

    const loadMappingContext = async () => {
        setIsLoading(true);
        try {
            const context = await MappingApi.getMappingContextByPublicId(profilePublicId);
            setProfileId(context.profileId);
            setSourceExamples(context.sourceExamples || []);
            setTargetExamples(context.targetExamples || []);
            const { newNodes, newEdges } = buildGraph(context);
            setNodes(newNodes);
            setEdges(newEdges);
        } catch (err) {
            console.error("Failed to load mapping context", err);
            alert("Failed to load mapping context");
        } finally {
            setIsLoading(false);
        }
    };

    const buildGraph = (context: MappingContextDto) => {
        const newNodes: Node[] = [];
        const newEdges: Edge[] = [];
        const GAP = 90;

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
            if (mapping.sourceFieldIds && mapping.sourceFieldIds.length > 0) {
                mapping.sourceFieldIds.forEach(sourceId => {
                    newEdges.push({
                        id: `e${sourceId}-${mapping.targetFieldId}`,
                        source: `source-${sourceId}`,
                        target: `target-${mapping.targetFieldId}`,
                        animated: true,
                        style: mapping.transformationLogic ? { stroke: '#6200ea', strokeWidth: 2 } : {},
                        data: { transformationLogic: mapping.transformationLogic }
                    });
                });
            } else if (mapping.sourceFieldId) {
                newEdges.push({
                    id: `e${mapping.sourceFieldId}-${mapping.targetFieldId}`,
                    source: `source-${mapping.sourceFieldId}`,
                    target: `target-${mapping.targetFieldId}`,
                    animated: true,
                    style: mapping.transformationLogic ? { stroke: '#6200ea', strokeWidth: 2 } : {},
                    data: { transformationLogic: mapping.transformationLogic }
                });
            }
        });

        return { newNodes, newEdges };
    };

    const handleConnect = useCallback(async (params: Connection) => {
        if (!params.source || !params.target) return;

        const sourceId = parseInt(params.source.replace('source-', ''));
        const targetId = parseInt(params.target.replace('target-', ''));

        const exists = edges.some(e => e.source === params.source && e.target === params.target);
        if (exists) return;

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
    }, [profileId, edges, setEdges]);

    const handleAutoMap = async () => {
        try {
            const suggestions = await MappingApi.suggestMappings(profileId);
            let addedCount = 0;
            const newEdgesList = [...edges];

            for (const s of suggestions) {
                const edgeId = `e${s.sourceFieldId}-${s.targetFieldId}`;
                if (!newEdgesList.find(e => e.id === edgeId)) {
                    if (newEdgesList.some(e => e.target === `target-${s.targetFieldId}`)) continue;

                    await MappingApi.saveMapping(profileId, {
                        sourceFieldId: s.sourceFieldId,
                        targetFieldId: s.targetFieldId,
                        transformationLogic: null
                    });
                    newEdgesList.push({
                        id: edgeId,
                        source: `source-${s.sourceFieldId}`,
                        target: `target-${s.targetFieldId}`,
                        animated: true,
                        style: { stroke: '#ff0072' }
                    });
                    addedCount++;
                }
            }
            setEdges(newEdgesList);
            alert(`Auto-mapped ${addedCount} fields based on AI suggestions!`);
        } catch (err) {
            console.error(err);
            alert('Failed to auto-map');
        }
    };

    const handleEdgesDelete = useCallback(async (edgesToDelete: Edge[]) => {
        for (const edge of edgesToDelete) {
            const targetId = parseInt(edge.target.replace('target-', ''));
            const otherEdges = edges.filter(e => e.target === edge.target && e.id !== edge.id && !edgesToDelete.find(d => d.id === e.id));

            if (otherEdges.length > 0) {
                const remainingSourceIds = otherEdges.map(e => parseInt(e.source.replace('source-', '')));
                try {
                    await MappingApi.saveMapping(profileId, {
                        targetFieldId: targetId,
                        sourceFieldIds: remainingSourceIds,
                        sourceFieldId: null,
                        transformationLogic: null
                    });
                } catch (err) {
                    alert("Failed to update mapping");
                    return;
                }
            } else {
                try {
                    await MappingApi.deleteMapping(profileId, targetId);
                } catch (err) {
                    console.error("Failed to delete mapping for target field " + targetId, err);
                    alert("Failed to delete mapping!");
                    return;
                }
            }
        }
        setEdges((eds) => eds.filter(e => !edgesToDelete.find(d => d.id === e.id)));
    }, [profileId, edges, setEdges]);

    const saveLogic = async (targetId: number, logic: string) => {
        const relatedEdges = edges.filter(e => e.target === `target-${targetId}`);
        const sourceIds = relatedEdges.map(e => parseInt(e.source.replace('source-', '')));

        try {
            await MappingApi.saveMapping(profileId, {
                sourceFieldId: null,
                targetFieldId: targetId,
                sourceFieldIds: sourceIds,
                transformationLogic: logic
            });

            setEdges(eds => eds.map(e => {
                if (e.target === `target-${targetId}`) {
                    return { ...e, data: { ...e.data, transformationLogic: logic }, style: logic ? { stroke: '#6200ea', strokeWidth: 2 } : {} };
                }
                return e;
            }));
            return true;
        } catch (err) {
            alert("Failed to save logic.");
            return false;
        }
    };

    return {
        profileId,
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect: handleConnect,
        onAutoMap: handleAutoMap,
        onEdgesDelete: handleEdgesDelete,
        saveLogic,
        sourceExamples,
        targetExamples,
        isLoading,
        setEdges // exposed for handleParams updates if needed, though mostly handled internally
    };
};
