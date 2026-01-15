import { useState, useRef } from 'react'
import { useUploadExample } from '../../api/hooks'
import { Modal, Button, toast } from '../../components/ui'

interface ExampleUploadModalProps {
  isOpen: boolean
  onClose: () => void
  dataObjectId: string
  systemPublicId: string
  dataObjectName: string
}

export function ExampleUploadModal({
  isOpen,
  onClose,
  dataObjectId,
  systemPublicId,
  dataObjectName,
}: ExampleUploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadExample = useUploadExample()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      toast('Please select an example file', 'error')
      return
    }

    try {
      await uploadExample.mutateAsync({
        dataObjectId,
        file,
        systemPublicId,
      })
      toast('Example uploaded successfully', 'success')
      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      onClose()
    } catch {
      toast('Failed to upload example', 'error')
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Add Example for ${dataObjectName}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">
            Example File
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.xml"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <p className="text-xs text-slate-500">
            Supported formats: JSON, XML
          </p>
        </div>

        {file && (
          <div className="p-3 bg-slate-50 rounded-lg text-sm">
            <span className="text-slate-600">Selected:</span>{' '}
            <span className="font-medium">{file.name}</span>
            <span className="text-slate-500 ml-2">
              ({(file.size / 1024).toFixed(1)} KB)
            </span>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={uploadExample.isPending || !file}>
            {uploadExample.isPending ? 'Uploading...' : 'Upload Example'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
