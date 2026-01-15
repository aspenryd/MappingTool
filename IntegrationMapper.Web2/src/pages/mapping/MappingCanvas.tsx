import { useCallback, useState, useMemo, type ComponentType } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ReactFlow,
  Controls,
  Background,
  type Connection,
  type Edge,
  type OnSelectionChangeParams,
  type NodeTypes,
  addEdge,
  useNodesState,
  useEdgesState,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useMappingContext, useSaveMapping, useDeleteMapping, useSuggestMappings } from '../../api/hooks'
import { apiClient } from '../../api/client'
import type { FieldDefinitionDto, MappingContextDto } from '../../api/types'
import { Button, toast } from '../../components/ui'
import { FieldNode } from './FieldNode'
import { CodeViewerModal } from './CodeViewerModal'
import { ExampleViewerModal } from './ExampleViewerModal'
import { MappingLogicModal } from './MappingLogicModal'

const nodeTypes: NodeTypes = {
  field: FieldNode as unknown as ComponentType<any>,
}

function buildGraph(context: MappingContextDto) {
  const nodes: any[] = []
  const edges: Edge[] = []
  const GAP = 90

  const flattenFields = (
    fields: FieldDefinitionDto[] | undefined,
    type: 'source' | 'target',
    xPos: number
  ) => {
    if (!fields) return
    const flattened: (FieldDefinitionDto & { level: number })[] = []

    const traverse = (list: FieldDefinitionDto[], level: number) => {
      list.forEach((field) => {
        flattened.push({ ...field, level })
        if (field.children) traverse(field.children, level + 1)
      })
    }
    traverse(fields, 0)

    flattened.forEach((field, index) => {
      nodes.push({
        id: `${type}-${field.id}`,
        type: 'field',
        position: { x: xPos + field.level * 20, y: index * GAP + 50 },
        data: {
          label: field.name || '',
          type,
          path: field.path || '',
          description: field.description,
          dataType: field.dataType || '',
          length: field.length,
          example: field.exampleValue,
          isArray: field.isArray,
          isMandatory: field.isMandatory,
          schemaAttributes: field.schemaAttributes,
          sampleValues: field.sampleValues,
        },
        draggable: false,
      })
    })
  }

  flattenFields(context.sourceFields, 'source', 0)
  flattenFields(context.targetFields, 'target', 600)

  context.existingMappings?.forEach((mapping) => {
    if (mapping.sourceFieldIds && mapping.sourceFieldIds.length > 0) {
      mapping.sourceFieldIds.forEach((sourceId) => {
        edges.push({
          id: `e${sourceId}-${mapping.targetFieldId}`,
          source: `source-${sourceId}`,
          target: `target-${mapping.targetFieldId}`,
          animated: true,
          style: mapping.transformationLogic
            ? { stroke: '#7c3aed', strokeWidth: 2 }
            : {},
          data: { transformationLogic: mapping.transformationLogic },
        })
      })
    } else if (mapping.sourceFieldId) {
      edges.push({
        id: `e${mapping.sourceFieldId}-${mapping.targetFieldId}`,
        source: `source-${mapping.sourceFieldId}`,
        target: `target-${mapping.targetFieldId}`,
        animated: true,
        style: mapping.transformationLogic
          ? { stroke: '#7c3aed', strokeWidth: 2 }
          : {},
        data: { transformationLogic: mapping.transformationLogic },
      })
    }
  })

  return { nodes, edges }
}

export function MappingCanvas() {
  const { id: profileId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: context, isLoading } = useMappingContext(profileId!)
  const saveMapping = useSaveMapping()
  const deleteMapping = useDeleteMapping()
  const suggestMappings = useSuggestMappings()

  const initialGraph = useMemo(() => {
    if (!context) return { nodes: [], edges: [] }
    return buildGraph(context)
  }, [context])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialGraph.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialGraph.edges)
  const [selectedEdges, setSelectedEdges] = useState<Edge[]>([])

  const [isCodeViewerOpen, setIsCodeViewerOpen] = useState(false)
  const [generatedCode, setGeneratedCode] = useState('')
  const [isExampleViewerOpen, setIsExampleViewerOpen] = useState(false)
  const [logicModal, setLogicModal] = useState<{
    targetId: number
    targetName: string
    sourceNames: string[]
    logic: string
  } | null>(null)
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false)
  const [edgeTooltip, setEdgeTooltip] = useState<{
    x: number
    y: number
    content: string
  } | null>(null)

  // Sync nodes/edges when context changes
  useMemo(() => {
    if (context) {
      const graph = buildGraph(context)
      setNodes(graph.nodes)
      setEdges(graph.edges)
    }
  }, [context, setNodes, setEdges])

  const onConnect = useCallback(
    async (params: Connection) => {
      if (!params.source || !params.target || !profileId) return

      const sourceId = parseInt(params.source.replace('source-', ''))
      const targetId = parseInt(params.target.replace('target-', ''))

      const exists = edges.some(
        (e) => e.source === params.source && e.target === params.target
      )
      if (exists) return

      const existingEdges = edges.filter((e) => e.target === params.target)
      const existingSourceIds = existingEdges.map((e) =>
        parseInt(e.source.replace('source-', ''))
      )
      const allSourceIds = [...existingSourceIds, sourceId]

      try {
        await saveMapping.mutateAsync({
          profileId,
          data: {
            targetFieldId: targetId,
            sourceFieldIds: allSourceIds,
            sourceFieldId: null,
            transformationLogic: null,
          },
        })
        setEdges((eds) => addEdge({ ...params, animated: true }, eds))
      } catch {
        toast('Failed to save mapping', 'error')
      }
    },
    [profileId, edges, saveMapping, setEdges]
  )

  const onEdgesDelete = useCallback(
    async (edgesToDelete: Edge[]) => {
      if (!profileId) return

      for (const edge of edgesToDelete) {
        const targetId = parseInt(edge.target.replace('target-', ''))
        const otherEdges = edges.filter(
          (e) =>
            e.target === edge.target &&
            e.id !== edge.id &&
            !edgesToDelete.find((d) => d.id === e.id)
        )

        if (otherEdges.length > 0) {
          const remainingSourceIds = otherEdges.map((e) =>
            parseInt(e.source.replace('source-', ''))
          )
          try {
            await saveMapping.mutateAsync({
              profileId,
              data: {
                targetFieldId: targetId,
                sourceFieldIds: remainingSourceIds,
                sourceFieldId: null,
                transformationLogic: null,
              },
            })
          } catch {
            toast('Failed to update mapping', 'error')
            return
          }
        } else {
          try {
            await deleteMapping.mutateAsync({ profileId, targetFieldId: targetId })
          } catch {
            toast('Failed to delete mapping', 'error')
            return
          }
        }
      }
      setEdges((eds) => eds.filter((e) => !edgesToDelete.find((d) => d.id === e.id)))
    },
    [profileId, edges, saveMapping, deleteMapping, setEdges]
  )

  const onSelectionChange = useCallback(
    ({ edges: selectedEdges }: OnSelectionChangeParams) => {
      setSelectedEdges(selectedEdges)
    },
    []
  )

  const handleAutoMap = async () => {
    if (!profileId) return
    try {
      const suggestions = await suggestMappings.mutateAsync(profileId)
      let addedCount = 0
      const newEdgesList = [...edges]

      for (const s of suggestions) {
        const edgeId = `e${s.sourceFieldId}-${s.targetFieldId}`
        if (!newEdgesList.find((e) => e.id === edgeId)) {
          if (newEdgesList.some((e) => e.target === `target-${s.targetFieldId}`))
            continue

          await saveMapping.mutateAsync({
            profileId,
            data: {
              sourceFieldId: s.sourceFieldId,
              targetFieldId: s.targetFieldId,
              transformationLogic: null,
            },
          })
          newEdgesList.push({
            id: edgeId,
            source: `source-${s.sourceFieldId}`,
            target: `target-${s.targetFieldId}`,
            animated: true,
            style: { stroke: '#ec4899' },
          })
          addedCount++
        }
      }
      setEdges(newEdgesList)
      toast(`Auto-mapped ${addedCount} fields based on AI suggestions!`, 'success')
    } catch {
      toast('Failed to auto-map', 'error')
    }
  }

  const handleEditSelectedComment = () => {
    if (selectedEdges.length === 0) return

    const firstTarget = selectedEdges[0].target
    const allSameTarget = selectedEdges.every((e) => e.target === firstTarget)

    if (!allSameTarget) {
      toast(
        'Please select mappings for a single target field to edit the comment/logic.',
        'warning'
      )
      return
    }

    const targetId = parseInt(firstTarget.replace('target-', ''))
    const targetNode = nodes.find((n) => n.id === firstTarget)
    const targetName = (targetNode?.data?.label as string) || 'Unknown'

    const allEdgesForTarget = edges.filter((e) => e.target === firstTarget)
    const sourceNames = allEdgesForTarget.map((e) => {
      const node = nodes.find((n) => n.id === e.source)
      return (node?.data?.label as string) || 'Unknown'
    })

    setLogicModal({
      targetId,
      targetName,
      sourceNames,
      logic: (selectedEdges[0].data?.transformationLogic as string) || '',
    })
  }

  const handleSaveLogic = async (logic: string) => {
    if (!logicModal || !profileId) return

    const relatedEdges = edges.filter(
      (e) => e.target === `target-${logicModal.targetId}`
    )
    const sourceIds = relatedEdges.map((e) =>
      parseInt(e.source.replace('source-', ''))
    )

    try {
      await saveMapping.mutateAsync({
        profileId,
        data: {
          sourceFieldId: null,
          targetFieldId: logicModal.targetId,
          sourceFieldIds: sourceIds,
          transformationLogic: logic,
        },
      })

      setEdges((eds) =>
        eds.map((e) => {
          if (e.target === `target-${logicModal.targetId}`) {
            return {
              ...e,
              data: { ...e.data, transformationLogic: logic },
              style: logic ? { stroke: '#7c3aed', strokeWidth: 2 } : {},
            }
          }
          return e
        })
      )
      setLogicModal(null)
      toast('Logic saved', 'success')
    } catch {
      toast('Failed to save logic', 'error')
    }
  }

  const handleDeleteSelected = () => {
    if (selectedEdges.length > 0) {
      onEdgesDelete(selectedEdges)
      setSelectedEdges([])
    }
  }

  const handleViewCode = async () => {
    if (!profileId) return
    try {
      const code = await apiClient.mappings.getCSharpCode(profileId)
      setGeneratedCode(code)
      setIsCodeViewerOpen(true)
    } catch {
      toast('Failed to fetch code', 'error')
    }
  }

  const handleExportExcel = () => {
    if (!profileId) return
    apiClient.mappings.exportExcel(profileId, `Mapping_${profileId}.xlsx`)
    setIsExportMenuOpen(false)
  }

  const handleExportCSharp = () => {
    if (!profileId) return
    apiClient.mappings.exportCSharp(profileId, `Mapping_${profileId}.cs`)
    setIsExportMenuOpen(false)
  }

  const onEdgeMouseEnter = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      if (edge.data?.transformationLogic) {
        setEdgeTooltip({
          x: (_.nativeEvent as MouseEvent).clientX,
          y: (_.nativeEvent as MouseEvent).clientY,
          content: edge.data.transformationLogic as string,
        })
      }
    },
    []
  )

  const onEdgeMouseLeave = useCallback(() => {
    setEdgeTooltip(null)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-500">Loading mapping context...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
            title="Go back"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-slate-900">Mapping Editor</h1>
          <div className="w-px h-6 bg-slate-200 mx-2" />

          <Button
            variant="secondary"
            size="sm"
            onClick={handleAutoMap}
            disabled={suggestMappings.isPending}
            className="bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200"
          >
            {suggestMappings.isPending ? 'Mapping...' : 'Auto-Map'}
          </Button>

          {selectedEdges.length > 0 && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleEditSelectedComment}
                className="bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200"
              >
                Edit Logic
              </Button>
              <Button variant="danger" size="sm" onClick={handleDeleteSelected}>
                Delete
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsExampleViewerOpen(true)}
          >
            Examples
          </Button>

          <div className="relative">
            <Button
              size="sm"
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
            >
              Output / Export
            </Button>
            {isExportMenuOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[180px] z-50">
                <button
                  onClick={() => {
                    handleViewCode()
                    setIsExportMenuOpen(false)
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50"
                >
                  View C# Code
                </button>
                <button
                  onClick={handleExportCSharp}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50"
                >
                  Download C# (.cs)
                </button>
                <div className="border-t border-slate-100 my-1" />
                <button
                  onClick={handleExportExcel}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50"
                >
                  Export Excel (.xlsx)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 bg-slate-50">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onEdgesDelete={onEdgesDelete}
          onConnect={onConnect}
          onSelectionChange={onSelectionChange}
          onEdgeMouseEnter={onEdgeMouseEnter}
          onEdgeMouseLeave={onEdgeMouseLeave}
          nodeTypes={nodeTypes}
          fitView
        >
          <Controls />
          <Background />
        </ReactFlow>

        {edgeTooltip && (
          <div
            className="fixed z-50 bg-slate-900 text-white px-3 py-2 rounded-lg text-sm max-w-xs"
            style={{ top: edgeTooltip.y + 10, left: edgeTooltip.x + 10 }}
          >
            <strong>Logic/Comment:</strong>
            <br />
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
        sourceExamples={context?.sourceExamples || []}
        targetExamples={context?.targetExamples || []}
      />

      {logicModal && (
        <MappingLogicModal
          isOpen={true}
          onClose={() => setLogicModal(null)}
          onSave={handleSaveLogic}
          currentLogic={logicModal.logic}
          targetFieldName={logicModal.targetName}
          sourceFieldNames={logicModal.sourceNames}
        />
      )}
    </div>
  )
}
