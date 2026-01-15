import { useState, useRef } from 'react'
import { useIngestSchema } from '../../api/hooks'
import { Modal, Button, Input, toast } from '../../components/ui'

interface SchemaUploadModalProps {
  isOpen: boolean
  onClose: () => void
  systemPublicId: string
}

export function SchemaUploadModal({
  isOpen,
  onClose,
  systemPublicId,
}: SchemaUploadModalProps) {
  const [name, setName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const ingestSchema = useIngestSchema()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast('Data object name is required', 'error')
      return
    }

    if (!file) {
      toast('Please select a schema file', 'error')
      return
    }

    try {
      const result = await ingestSchema.mutateAsync({
        systemPublicId,
        name,
        file,
      })
      toast(
        `Schema uploaded successfully. ${result.fieldCount} fields detected.`,
        'success'
      )
      setName('')
      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      onClose()
    } catch {
      toast('Failed to upload schema', 'error')
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      if (!name) {
        const baseName = selectedFile.name.replace(/\.[^/.]+$/, '')
        setName(baseName)
      }
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Schema">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Data Object Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Customer, Order, Invoice"
          required
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">
            Schema File
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.xsd,.xml"
            onChange={handleFileChange}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <p className="text-xs text-slate-500">
            Supported formats: JSON Schema, XSD, XML Schema
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
          <Button type="submit" disabled={ingestSchema.isPending || !file}>
            {ingestSchema.isPending ? 'Uploading...' : 'Upload Schema'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
