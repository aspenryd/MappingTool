import { useState } from 'react'
import { useCreateSystem } from '../../api/hooks'
import { Modal, Button, Input, toast } from '../../components/ui'

interface AddSystemModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AddSystemModal({ isOpen, onClose }: AddSystemModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    externalId: '',
    description: '',
    category: '',
  })

  const createSystem = useCreateSystem()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast('System name is required', 'error')
      return
    }

    try {
      await createSystem.mutateAsync(formData)
      toast('System created successfully', 'success')
      setFormData({ name: '', externalId: '', description: '', category: '' })
      onClose()
    } catch {
      toast('Failed to create system', 'error')
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New System">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="System Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., SAP ERP"
          required
        />

        <Input
          label="External ID"
          name="externalId"
          value={formData.externalId}
          onChange={handleChange}
          placeholder="e.g., SAP-001"
        />

        <Input
          label="Category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          placeholder="e.g., ERP, CRM, HRM"
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe the system..."
            rows={3}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={createSystem.isPending}>
            {createSystem.isPending ? 'Creating...' : 'Create System'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
