import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useSystem, useDataObjects } from '../../api/hooks'
import { useAuth } from '../../auth/AuthProvider'
import { PageHeader } from '../../components/layout'
import { Button, toast } from '../../components/ui'
import { SchemaUploadModal } from './SchemaUploadModal'
import { SchemaViewerModal } from './SchemaViewerModal'
import { ExampleUploadModal } from './ExampleUploadModal'
import { apiClient } from '../../api/client'
import { useQueryClient } from '@tanstack/react-query'

export function SystemDetail() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const { data: system, isLoading: systemLoading } = useSystem(id!)
  const { data: dataObjects, isLoading: objectsLoading } = useDataObjects(id!)
  const { isAdmin, token } = useAuth()

  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [viewerModal, setViewerModal] = useState<{
    id: string
    name: string
  } | null>(null)
  const [exampleModal, setExampleModal] = useState<{
    dataObjectId: string
    name: string
  } | null>(null)
  const [deletingDataObjectId, setDeletingDataObjectId] = useState<string | null>(null)
  const [deletingExampleId, setDeletingExampleId] = useState<string | null>(null)

  if (systemLoading || objectsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading...</div>
      </div>
    )
  }

  if (!system) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">System not found</div>
      </div>
    )
  }

  const handleDownloadSchema = async (schemaId: string, name: string) => {
    try {
      await apiClient.schemas.downloadContent(schemaId, `${name}.schema`)
      toast('Schema downloaded', 'success')
    } catch {
      toast('Failed to download schema', 'error')
    }
  }

  const handleDeleteDataObject = async (dataObjectId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will delete the schema and all examples.`)) {
      return
    }

    setDeletingDataObjectId(dataObjectId)
    try {
      const response = await fetch(`/api/schemas/data-objects/${dataObjectId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        await queryClient.invalidateQueries({ queryKey: ['dataObjects', id] })
        toast('Data object deleted', 'success')
      } else {
        toast('Failed to delete data object', 'error')
      }
    } catch {
      toast('Failed to delete data object', 'error')
    } finally {
      setDeletingDataObjectId(null)
    }
  }

  const handleDeleteExample = async (exampleId: string) => {
    if (!confirm('Are you sure you want to delete this example?')) {
      return
    }

    setDeletingExampleId(exampleId)
    try {
      const response = await fetch(`/api/schemas/examples/${exampleId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        await queryClient.invalidateQueries({ queryKey: ['dataObjects', id] })
        toast('Example deleted', 'success')
      } else {
        toast('Failed to delete example', 'error')
      }
    } catch {
      toast('Failed to delete example', 'error')
    } finally {
      setDeletingExampleId(null)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={system.name || 'System Details'}
        backTo="/systems"
        actions={
          <Button onClick={() => setIsUploadOpen(true)}>+ Add Data Object</Button>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="card mb-6">
          <div className="card-body">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-slate-500">External ID:</span>
                <span className="ml-2 font-medium">
                  {system.externalId || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Category:</span>
                <span className="ml-2 font-medium">
                  {system.category || 'N/A'}
                </span>
              </div>
              <div className="col-span-3">
                <span className="text-slate-500">Description:</span>
                <span className="ml-2">{system.description || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Data Objects ({dataObjects?.length ?? 0})
        </h2>

        {!dataObjects || dataObjects.length === 0 ? (
          <div className="card p-8 text-center text-slate-500">
            No data objects yet. Upload a schema to get started.
          </div>
        ) : (
          <div className="grid gap-4">
            {dataObjects.map((obj) => (
              <div key={obj.id} className="card">
                <div className="card-body">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900">{obj.name}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-600">
                        <span>
                          Type:{' '}
                          <span className="px-2 py-0.5 bg-slate-100 rounded">
                            {obj.schemaType}
                          </span>
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          setViewerModal({ id: obj.id, name: obj.name || 'Schema' })
                        }
                      >
                        View Schema
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          handleDownloadSchema(obj.id, obj.name || 'schema')
                        }
                      >
                        Download
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteDataObject(obj.id, obj.name || 'data object')}
                          disabled={deletingDataObjectId === obj.id}
                        >
                          {deletingDataObjectId === obj.id ? 'Deleting...' : 'Delete'}
                        </Button>
                      )}
                    </div>
                  </div>

                  {obj.examples && obj.examples.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-slate-700">
                          Examples ({obj.examples.length})
                        </h4>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            setExampleModal({
                              dataObjectId: obj.id,
                              name: obj.name || 'Data Object',
                            })
                          }
                        >
                          + Add Example
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {obj.examples.map((ex) => (
                          <span
                            key={ex.id}
                            className="group px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 flex items-center gap-2"
                          >
                            {ex.fileName}
                            {isAdmin && (
                              <button
                                onClick={() => handleDeleteExample(ex.id)}
                                disabled={deletingExampleId === ex.id}
                                className="text-red-400 hover:text-red-600 ml-1"
                                title="Delete example"
                              >
                                ×
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {(!obj.examples || obj.examples.length === 0) && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          setExampleModal({
                            dataObjectId: obj.id,
                            name: obj.name || 'Data Object',
                          })
                        }
                      >
                        + Add Example
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <SchemaUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        systemPublicId={id!}
      />

      {viewerModal && (
        <SchemaViewerModal
          isOpen={true}
          onClose={() => setViewerModal(null)}
          schemaId={viewerModal.id}
          title={viewerModal.name}
        />
      )}

      {exampleModal && (
        <ExampleUploadModal
          isOpen={true}
          onClose={() => setExampleModal(null)}
          dataObjectId={exampleModal.dataObjectId}
          systemPublicId={id!}
          dataObjectName={exampleModal.name}
        />
      )}
    </div>
  )
}
