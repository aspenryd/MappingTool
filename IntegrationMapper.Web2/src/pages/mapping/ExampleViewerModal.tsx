import { useState } from 'react'
import { Modal, Button, toast } from '../../components/ui'
import type { DataObjectExampleDto } from '../../api/types'
import { apiClient } from '../../api/client'

interface ExampleViewerModalProps {
  isOpen: boolean
  onClose: () => void
  sourceExamples: DataObjectExampleDto[]
  targetExamples: DataObjectExampleDto[]
}

export function ExampleViewerModal({
  isOpen,
  onClose,
  sourceExamples,
  targetExamples,
}: ExampleViewerModalProps) {
  const [selectedExample, setSelectedExample] = useState<{
    id: string
    name: string
    type: 'source' | 'target'
  } | null>(null)
  const [content, setContent] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const handleViewExample = async (
    id: string,
    name: string,
    type: 'source' | 'target'
  ) => {
    setSelectedExample({ id, name, type })
    setIsLoading(true)
    try {
      const data = await apiClient.schemas.getExampleContent(id)
      setContent(typeof data === 'string' ? data : JSON.stringify(data, null, 2))
    } catch {
      toast('Failed to load example content', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Data Examples" size="xl">
      <div className="flex gap-4 h-[60vh]">
        <div className="w-1/3 space-y-4 overflow-y-auto pr-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-2">
              Source Examples
            </h3>
            {sourceExamples.length === 0 ? (
              <p className="text-sm text-slate-500">No examples available</p>
            ) : (
              <div className="space-y-1">
                {sourceExamples.map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => handleViewExample(ex.id, ex.fileName || '', 'source')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedExample?.id === ex.id
                        ? 'bg-blue-100 text-blue-800'
                        : 'hover:bg-slate-100'
                    }`}
                  >
                    {ex.fileName}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-2">
              Target Examples
            </h3>
            {targetExamples.length === 0 ? (
              <p className="text-sm text-slate-500">No examples available</p>
            ) : (
              <div className="space-y-1">
                {targetExamples.map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => handleViewExample(ex.id, ex.fileName || '', 'target')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedExample?.id === ex.id
                        ? 'bg-blue-100 text-blue-800'
                        : 'hover:bg-slate-100'
                    }`}
                  >
                    {ex.fileName}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 border-l border-slate-200 pl-4">
          {!selectedExample ? (
            <div className="flex items-center justify-center h-full text-slate-500">
              Select an example to view its content
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center h-full text-slate-500">
              Loading...
            </div>
          ) : (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-700">
                  {selectedExample.name}
                  <span
                    className={`ml-2 px-2 py-0.5 text-xs rounded ${
                      selectedExample.type === 'source'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {selectedExample.type}
                  </span>
                </h3>
              </div>
              <pre className="flex-1 bg-slate-900 text-slate-100 p-4 rounded-lg overflow-auto text-sm">
                {content}
              </pre>
            </div>
          )}
        </div>
      </div>
      <div className="flex justify-end mt-4">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  )
}
