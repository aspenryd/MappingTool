import { useState, useMemo } from 'react'
import { useCreateProject, useSystems } from '../../api/hooks'
import { Modal, Button, Input, toast } from '../../components/ui'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: (id: string) => void
}

export function CreateProjectModal({
  isOpen,
  onClose,
  onCreated,
}: CreateProjectModalProps) {
  const { data: systems } = useSystems()
  const createProject = useCreateProject()

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sourceSystemPublicId: '',
    targetSystemPublicId: '',
  })

  const [sourceFilter, setSourceFilter] = useState('')
  const [targetFilter, setTargetFilter] = useState('')

  const filteredSourceSystems = useMemo(() => {
    if (!systems) return []
    if (!sourceFilter.trim()) return systems
    const term = sourceFilter.toLowerCase()
    return systems.filter(s =>
      s.name?.toLowerCase().includes(term) ||
      s.category?.toLowerCase().includes(term)
    )
  }, [systems, sourceFilter])

  const filteredTargetSystems = useMemo(() => {
    if (!systems) return []
    if (!targetFilter.trim()) return systems
    const term = targetFilter.toLowerCase()
    return systems.filter(s =>
      s.name?.toLowerCase().includes(term) ||
      s.category?.toLowerCase().includes(term)
    )
  }, [systems, targetFilter])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast('Project name is required', 'error')
      return
    }

    if (!formData.sourceSystemPublicId || !formData.targetSystemPublicId) {
      toast('Please select both source and target systems', 'error')
      return
    }

    if (formData.sourceSystemPublicId === formData.targetSystemPublicId) {
      toast('Source and target systems must be different', 'error')
      return
    }

    try {
      const result = await createProject.mutateAsync(formData)
      toast('Project created successfully', 'success')
      setFormData({
        name: '',
        description: '',
        sourceSystemPublicId: '',
        targetSystemPublicId: '',
      })
      setSourceFilter('')
      setTargetFilter('')
      onCreated(result.id)
    } catch {
      toast('Failed to create project', 'error')
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Project" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Project Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., SAP to Salesforce Customer Sync"
          required
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe the purpose of this mapping project..."
            rows={3}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">
              Source System
            </label>
            <input
              type="text"
              placeholder="Filter systems..."
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 mb-1"
            />
            <select
              name="sourceSystemPublicId"
              value={formData.sourceSystemPublicId}
              onChange={handleChange}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
              required
              size={5}
            >
              <option value="">Select source system...</option>
              {filteredSourceSystems.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.category ? `(${s.category})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">
              Target System
            </label>
            <input
              type="text"
              placeholder="Filter systems..."
              value={targetFilter}
              onChange={(e) => setTargetFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 mb-1"
            />
            <select
              name="targetSystemPublicId"
              value={formData.targetSystemPublicId}
              onChange={handleChange}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
              required
              size={5}
            >
              <option value="">Select target system...</option>
              {filteredTargetSystems.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.category ? `(${s.category})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={createProject.isPending}>
            {createProject.isPending ? 'Creating...' : 'Create Project'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
