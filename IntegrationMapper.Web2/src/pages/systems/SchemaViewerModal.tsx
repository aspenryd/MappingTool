import { useState, useEffect } from 'react'
import { Modal, Button, toast } from '../../components/ui'
import { apiClient } from '../../api/client'
import Prism from 'prismjs'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-markup'

interface SchemaViewerModalProps {
  isOpen: boolean
  onClose: () => void
  schemaId: string
  title: string
}

export function SchemaViewerModal({
  isOpen,
  onClose,
  schemaId,
  title,
}: SchemaViewerModalProps) {
  const [content, setContent] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isOpen && schemaId) {
      setIsLoading(true)
      apiClient.schemas
        .getContent(schemaId)
        .then((data) => {
          setContent(typeof data === 'string' ? data : JSON.stringify(data, null, 2))
        })
        .catch(() => {
          toast('Failed to load schema content', 'error')
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [isOpen, schemaId])

  const isJson = content.trim().startsWith('{') || content.trim().startsWith('[')
  const language = isJson ? 'json' : 'markup'

  const highlightedCode = content
    ? Prism.highlight(content, Prism.languages[language], language)
    : ''

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="xl">
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-500">Loading schema...</div>
        </div>
      ) : (
        <div className="space-y-4">
          <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-auto max-h-[60vh] text-sm">
            <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
          </pre>
          <div className="flex justify-end">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
