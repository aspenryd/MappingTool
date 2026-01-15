import { useMemo } from 'react'
import { Modal, Button } from '../../components/ui'
import Prism from 'prismjs'
import 'prismjs/components/prism-csharp'

interface CodeViewerModalProps {
  isOpen: boolean
  onClose: () => void
  code: string
  title: string
}

export function CodeViewerModal({
  isOpen,
  onClose,
  code,
  title,
}: CodeViewerModalProps) {
  const highlightedCode = useMemo(() => {
    if (!code) return ''
    return Prism.highlight(code, Prism.languages.csharp, 'csharp')
  }, [code])

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="xl">
      <div className="space-y-4">
        <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-auto max-h-[60vh] text-sm leading-relaxed">
          <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
        </pre>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={handleCopy}>
            Copy to Clipboard
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}
